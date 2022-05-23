import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor, Type, UseInterceptors
} from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { FileInjectorHandler } from "../handlers/file-injector.handler";
import { FileFieldMetadataUtils } from "../utils/file-field-metadata.utils";

export const FileInjector = <T>(bodyType: Type<T>): PropertyDecorator =>
    UseInterceptors(new FileInjectorInterceptor(bodyType));

@Injectable()
export class FileInjectorInterceptor<T> implements NestInterceptor {
    constructor(private type: Type<T>) {}

    public async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest<Request>();
        if (
            request.get("content-type").startsWith("multipart/form-data") &&
            FileFieldMetadataUtils.findTypeFileFieldsPropertyKeys(this.type)?.length
        ) {
            const handler = new FileInjectorHandler(this.type, request);
            await handler.handle();
        }

        return next.handle();
    }
}
