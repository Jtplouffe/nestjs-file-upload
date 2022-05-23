import "reflect-metadata";
import { FILE_FIELD_METADATA_KEY, TYPE_FILE_FIELD_PROPERTY_KEYS_KEY } from "../constants/constants";
import { FileFieldMetadata } from "../interfaces/file-field-metadata.interface";

export type FileFieldOptions = Omit<FileFieldMetadata, "propertyKey">;

export const FileField = (opts: FileFieldOptions = {}): PropertyDecorator => {
    return (target: any, propertyKey: string | symbol): void => {
        opts.fieldname ??= propertyKey as string;
        opts.maxFile ??= 1;

        const metadata: FileFieldMetadata = {
            ...opts,
            propertyKey,
        };

        Reflect.defineMetadata(FILE_FIELD_METADATA_KEY, metadata, target.constructor, propertyKey);

        const typeFileFields: Array<string | symbol> = Reflect.getMetadata(TYPE_FILE_FIELD_PROPERTY_KEYS_KEY, target.constructor);
        if (!typeFileFields?.includes(propertyKey)) {
            Reflect.defineMetadata(TYPE_FILE_FIELD_PROPERTY_KEYS_KEY, [...(typeFileFields ?? []), propertyKey], target.constructor);
        }
    };
};
