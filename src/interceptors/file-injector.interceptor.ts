import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    PayloadTooLargeException,
    Type,
    UnsupportedMediaTypeException
} from "@nestjs/common";
import appendField from "append-field";
import * as Busboy from "busboy";
import { Busboy as BusboyType } from "busboy";
import { Request } from "express";
import { Observable } from "rxjs";
import { Readable } from "stream";
import { File } from "../interfaces/file.interface";
import { FileFieldMetadataUtils } from "../utils/file-field-metadata.utils";

@Injectable()
export class FileInjectorInterceptor<T> implements NestInterceptor {
    constructor(private type: Type<T>) {}

    public async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest<Request>();
        if (
            request.get("content-type").startsWith("multipart/form-data") &&
            FileFieldMetadataUtils.findTypeFileFieldsPropertyKeys(this.type)?.length
        ) {
            await this.handle(request);
        }

        return next.handle();
    }

    private async handle(request: Request): Promise<void> {
        request.body = Object.create(null);
        const busboy: BusboyType = Busboy.default({
            headers: request.headers,
            limits: {
                fileSize: FileFieldMetadataUtils.maxFileSizeForType(this.type) || undefined,
            },
        });

        const filePromises = [];

        busboy.on("field", (fieldname: string, value: string, fieldInfo: Busboy.FieldInfo) => {
            this.onField(fieldname, value, fieldInfo, request);
        });
        busboy.on("file", (fieldname, stream: Readable, fileInfo: Busboy.FileInfo) => {
            filePromises.push(this.onFile(fieldname, stream, fileInfo, request));
        });

        return new Promise((resolve, reject) => {
            busboy.on("error", (error) => {
                busboy.removeAllListeners();
                reject(error);
            });

            busboy.on("partsLimit", () => {
                busboy.removeAllListeners();
                reject(new PayloadTooLargeException());
            });

            busboy.on("filesLimit", () => {
                busboy.removeAllListeners();
                reject(new PayloadTooLargeException());
            });

            busboy.on("finish", async () => {
                await Promise.all(filePromises);
                busboy.removeAllListeners();
                resolve();
            });

            request.pipe(busboy);
        });
    }

    private onField(fieldname: string, value: string, fieldInfo: Busboy.FieldInfo, request: Request): void {
        if (Object.getOwnPropertyDescriptor(Object.prototype, fieldname)) return;
        if (!fieldname) throw new BadRequestException("Field name cannot be empty");
        if (fieldInfo.nameTruncated) throw new PayloadTooLargeException("Field name truncated");
        if (fieldInfo.valueTruncated) throw new PayloadTooLargeException("Field value truncated");

        appendField(request.body, fieldname, value);
    }

    private async onFile(
        fieldname: string,
        stream: Readable,
        fileInfo: Busboy.FileInfo,
        request: Request
    ): Promise<void> {
        const fileFieldMetadata = FileFieldMetadataUtils.findFileFieldMetadataByFieldname(this.type, fieldname);
        if (!fileFieldMetadata) return;
        if (
            fileFieldMetadata.allowedMimeTypes?.length &&
            !fileFieldMetadata.allowedMimeTypes.includes(fileInfo.mimeType)
        ) {
            throw new UnsupportedMediaTypeException(
                `File '${fieldname}' has unsupported media type '${
                    fileInfo.mimeType
                }'. Supported media types: '${fileFieldMetadata.allowedMimeTypes.join(", ")}'`
            );
        }

        if (this.getFieldCount(request.body, fieldname) > (fileFieldMetadata.maxFile ?? 1)) {
            throw new BadRequestException(
                `Expected maximum ${fileFieldMetadata.maxFile ?? 1} file(s) for field '${fieldname}.'`
            );
        }

        const file = await new Promise<File>((resolve, reject) => {
            const chunks = [];

            stream.on("data", (chunk) => {
                if (fileFieldMetadata.maxSize && fileFieldMetadata.maxSize > 0) {
                    const accumulatedSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                    if (accumulatedSize + chunk.length > fileFieldMetadata.maxSize) {
                        stream.removeAllListeners();
                        reject(
                            new PayloadTooLargeException(
                                `File ${fieldname} is too large. Max allow size is ${fileFieldMetadata.maxSize} bytes.`
                            )
                        );
                        return;
                    }

                    chunks.push(chunk);
                }
            });

            stream.on("error", (error) => {
                stream.removeAllListeners();
                reject(error);
            });

            stream.on("limit", () => {
                stream.removeAllListeners();
                reject(
                    new PayloadTooLargeException(
                        `File ${fieldname} is too large. Max allow size is ${fileFieldMetadata.maxSize} bytes.`
                    )
                );
            });

            stream.on("end", () => {
                stream.removeAllListeners();
                resolve({
                    fieldname,
                    filename: fileInfo.filename,
                    mediaType: fileInfo.mimeType,
                    encoding: fileInfo.encoding,
                    buffer: Buffer.concat(chunks),
                });
            });
        });

        appendField(request.body, fieldname, file);
    }

    private getFieldCount(body: Object, fieldname: string): number {
        if (Array.isArray(body[fieldname])) return body[fieldname].length;
        if (body[fieldname] != null && body[fieldname] !== undefined) return 1;
        return 0;
    }
}
