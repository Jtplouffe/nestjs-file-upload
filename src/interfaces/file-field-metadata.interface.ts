export interface FileFieldMetadata {
    fieldname?: string;
    propertyKey: string | symbol;

    allowedMimeTypes?: string[];
    maxSize?: number;
    maxFile?: number;
}
