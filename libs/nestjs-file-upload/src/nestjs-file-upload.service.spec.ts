import { Test, TestingModule } from '@nestjs/testing';
import { NestjsFileUploadService } from './nestjs-file-upload.service';

describe('NestjsFileUploadService', () => {
  let service: NestjsFileUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestjsFileUploadService],
    }).compile();

    service = module.get<NestjsFileUploadService>(NestjsFileUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
