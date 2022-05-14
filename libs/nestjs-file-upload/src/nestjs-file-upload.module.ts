import { Module } from '@nestjs/common';
import { NestjsFileUploadService } from './nestjs-file-upload.service';

@Module({
  providers: [NestjsFileUploadService],
  exports: [NestjsFileUploadService],
})
export class NestjsFileUploadModule {}
