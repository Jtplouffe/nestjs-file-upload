"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileField = void 0;
require("reflect-metadata");
const constants_1 = require("../constants/constants");
const FileField = (opts = {}) => {
    return (target, propertyKey) => {
        opts.fieldname ??= propertyKey;
        const metadata = {
            ...opts,
            propertyKey
        };
        Reflect.defineMetadata(constants_1.FILE_FIELD_METADATA_KEY, metadata, target, propertyKey);
        const typeFileFields = Reflect.getMetadata(constants_1.TYPE_FILE_FIELD_PROPERTY_KEYS_KEY, target);
        if (!typeFileFields?.includes(propertyKey)) {
            Reflect.defineMetadata(constants_1.TYPE_FILE_FIELD_PROPERTY_KEYS_KEY, [...typeFileFields, propertyKey], target);
        }
    };
};
exports.FileField = FileField;
//# sourceMappingURL=file-field.decorator.js.map