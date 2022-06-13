import { Body, Controller, Post, ValidationPipe } from "@nestjs/common";
import { FileInjector } from "nestjs-file-upload";
import { UploadPhotoDto } from "./upload.dto";

@Controller()
export class AppController {
    @Post("photo")
    @FileInjector(UploadPhotoDto)
    public getHello(@Body(ValidationPipe) dto: UploadPhotoDto): void {
        console.log(dto);
    }
}
