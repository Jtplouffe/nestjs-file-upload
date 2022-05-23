import { FILE_FIELD_METADATA_KEY, TYPE_FILE_FIELD_PROPERTY_KEYS_KEY } from "../constants/constants";
import { FileFieldMetadata } from "../interfaces/file-field-metadata.interface";

export class FileFieldMetadataUtils {
    public static findTypeFileFieldsPropertyKeys(target: Object): (string | symbol)[] | undefined {
        return Reflect.getMetadata(TYPE_FILE_FIELD_PROPERTY_KEYS_KEY, target);
    }

    public static findFileFieldMetadataByFieldname(target: Object, filename: string): FileFieldMetadata | undefined {
        const fileFieldPropertyKeys = this.findTypeFileFieldsPropertyKeys(target);

        for (const propertyKey of fileFieldPropertyKeys) {
            const metadata = this.findFileFieldMetadata(target, propertyKey);
            if ((metadata.fieldname ?? metadata.propertyKey) === filename) {
                return metadata;
            }
        }
    }

    public static findFileFieldMetadata(target: Object, propertyKey: string | symbol) : FileFieldMetadata | undefined {
        return Reflect.getMetadata(FILE_FIELD_METADATA_KEY, target, propertyKey);
    }

    public static maxFileSizeForType(target: Object): number {
        const fileFieldPropertyKeys = this.findTypeFileFieldsPropertyKeys(target);

        return fileFieldPropertyKeys.reduce((maxSize, propertyKey) => {
            const fileFieldMetadata = this.findFileFieldMetadata(target, propertyKey);
            if ((fileFieldMetadata?.maxSize ?? 0) > maxSize) return fileFieldMetadata.maxSize;
            return maxSize;
        }, 0);
    }
}
