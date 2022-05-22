import "reflect-metadata";
import { FileFieldMetadata } from "../interfaces/file-field-metadata.interface";
export declare type FileFieldOptions = Omit<FileFieldMetadata, "propertyKey">;
export declare const FileField: (opts?: FileFieldOptions) => PropertyDecorator;
//# sourceMappingURL=file-field.decorator.d.ts.map