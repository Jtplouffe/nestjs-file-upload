import { Expose } from "class-transformer";
import { ArrayMinSize, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { File, FileField } from "nestjs-file-upload";

export class UploadPhotoDto {
    @Expose()
    @IsString()
    @MinLength(5)
    @MaxLength(255)
    @IsNotEmpty()
    name: string;

    @Expose()
    @FileField({ allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"], maxSize: 5 * 1000 * 1000 })
    @IsNotEmpty()
    photo: File;

    @Expose()
    @FileField({ allowedMimeTypes: ["image/webp"] })
    @IsOptional()
    thumbnail?: File;

    @Expose()
    @FileField({ allowedMimeTypes: ["text/markdown"], maxFile: 10 })
    @ArrayMinSize(3)
    @IsNotEmpty()
    additionalAssets: File[];
}
