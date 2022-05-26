import { BadRequestException, PayloadTooLargeException, Type, UnsupportedMediaTypeException } from "@nestjs/common";
import appendField from "append-field";
import * as Busboy from "busboy";
import { Busboy as BusboyType } from "busboy";
import { Request } from "express";
import { Readable } from "stream";
import { FileFieldMetadata } from "../interfaces/file-field-metadata.interface";
import { File } from "../interfaces/file.interface";
import { FileFieldMetadataUtils } from "../utils/file-field-metadata.utils";

export class FileInjectorHandler<T> {
    private busboy: BusboyType;
    private filePromises = [];

    constructor(private type: Type<T>, private request: Request) {
        this.busboy = Busboy.default({
            headers: request.headers,
            limits: {
                fileSize: FileFieldMetadataUtils.maxFileSizeForType(type) || undefined,
            },
        });
    }

    public async handle(): Promise<void> {
        this.request.body = Object.create(null);

        this.busboy.on("field", (fieldname: string, value: string, fieldInfo: Busboy.FieldInfo) => {
            this.onField(fieldname, value, fieldInfo);
        });

        this.busboy.on("file", (fieldname: string, stream: Readable, fileInfo: Busboy.FileInfo) => {
            this.filePromises.push(this.onFile(fieldname, stream, fileInfo));
        });

        return new Promise((resolve, reject) => {
            this.busboy.on("error", (error) => {
                this.onDone();
                reject(error);
            });
            this.busboy.on("partsLimit", () => this.onError(new PayloadTooLargeException()));
            this.busboy.on("filesLimit", () => this.onError(new PayloadTooLargeException()));

            this.busboy.on("finish", async () => {
                await Promise.all(this.filePromises);
                this.onDone();
                resolve();
            });

            this.request.pipe(this.busboy);
        });
    }

    private onField(fieldname: string, value: string, fieldInfo: Busboy.FieldInfo): void {
        if (!fieldname) return this.onError(new BadRequestException("Fieldname missing"));
        if (Object.getOwnPropertyDescriptor(Object.prototype, fieldname)) return;
        if (fieldInfo.nameTruncated) return this.onError(new PayloadTooLargeException("Fieldname truncated"));
        if (fieldInfo.valueTruncated) return this.onError(new PayloadTooLargeException("Field value truncated"));

        appendField(this.request.body, fieldname, value);
    }

    private async onFile(fieldname: string, stream: Readable, fileInfo: Busboy.FileInfo): Promise<void> {
        if (!fieldname) {
            stream.resume();
            return;
        }
        if (Object.getOwnPropertyDescriptor(Object.prototype, fieldname)) {
            stream.resume();
            return;
        }

        const normalizedFieldname = fieldname.endsWith("[]") ? fieldname.substring(0, fieldname.length - 2) : fieldname;
        const fileFieldMetadata = FileFieldMetadataUtils.findFileFieldMetadataByFieldname(
            this.type,
            normalizedFieldname
        );
        if (!fileFieldMetadata) {
            stream.resume();
            return;
        }

        if (
            fileFieldMetadata.allowedMimeTypes?.length &&
            !fileFieldMetadata.allowedMimeTypes.includes(fileInfo.mimeType)
        ) {
            stream.resume();
            return this.onError(
                new UnsupportedMediaTypeException(
                    `File '${fieldname}' has unsupported media type '${
                        fileInfo.mimeType
                    }'. Supported media types: '${fileFieldMetadata.allowedMimeTypes.join(", ")}'`
                )
            );
        }

        if (this.getBodyFieldCount(fieldname) >= fileFieldMetadata.maxFile) {
            stream.resume();
            return this.onError(
                new BadRequestException(
                    `Expected maximum ${fileFieldMetadata.maxFile} file(s) for field '${fieldname}.'`
                )
            );
        }

        let buffer;
        try {
            buffer = await this.readFileBuffer(fieldname, stream, fileFieldMetadata);
        } catch (e) {
            stream.resume();
            return this.onError(e);
        }

        // We need to check again, since a file could have been added to the body during the redaing of the buffer.
        if (this.getBodyFieldCount(fieldname) >= fileFieldMetadata.maxFile) {
            stream.resume();
            return this.onError(
                new BadRequestException(
                    `Expected maximum ${fileFieldMetadata.maxFile} file(s) for field '${fieldname}.'`
                )
            );
        }

        const file: File = {
            fieldname,
            filename: fileInfo.filename,
            mediaType: fileInfo.mimeType,
            encoding: fileInfo.encoding,
            buffer,
        };

        if (fileFieldMetadata.maxFile > 1) {
            const currentBodyFieldValue = this.request.body[normalizedFieldname];
            if (!Array.isArray(currentBodyFieldValue)) {
                this.request.body[normalizedFieldname] = [];
                if (currentBodyFieldValue) this.request.body.push(currentBodyFieldValue);
            }
        }

        appendField(this.request.body, fieldname, file);
    }

    private readFileBuffer(fieldname: string, stream: Readable, fileFieldMetadata: FileFieldMetadata): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            const chunks = [];

            stream.on("data", (chunk) => {
                if (fileFieldMetadata.maxSize && fileFieldMetadata.maxSize > 0) {
                    const accumulatedSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                    if (accumulatedSize + chunk.length > fileFieldMetadata.maxSize) {
                        stream.removeAllListeners();
                        reject(
                            new PayloadTooLargeException(
                                `File '${fieldname}' is too large. Max allow size is ${fileFieldMetadata.maxSize} bytes.`
                            )
                        );
                        return;
                    }
                }

                chunks.push(chunk);
            });

            stream.on("error", (error) => {
                stream.removeAllListeners();
                reject(error);
            });

            stream.on("limit", () => {
                stream.removeAllListeners();
                reject(
                    new PayloadTooLargeException(
                        `File '${fieldname}' is too large. Max allow size is ${fileFieldMetadata.maxSize} bytes.`
                    )
                );
            });

            stream.on("end", () => {
                stream.removeAllListeners();
                resolve(Buffer.concat(chunks));
            });
        });
    }

    private onError(error): void {
        this.busboy.emit("error", error);
    }

    private onDone(): void {
        this.request.on("readable", () => this.request.read());
        this.request.unpipe(this.busboy);
        this.busboy.removeAllListeners();
    }

    private getBodyFieldCount(fieldname: string): number {
        if (Array.isArray(this.request.body[fieldname])) return this.request.body[fieldname].length;
        if (this.request.body[fieldname] !== null && this.request.body[fieldname] !== undefined) return 1;
        return 0;
    }
}
