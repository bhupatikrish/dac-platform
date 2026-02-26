import { Module } from '@nestjs/common';
import { StorageProvider } from './storage/storage.provider';
import { LocalDiskStorageService } from './storage/local-disk.service';
import { AwsS3StorageService } from './storage/aws-s3.service';

@Module({
  controllers: [],
  providers: [
    LocalDiskStorageService,
    AwsS3StorageService,
    {
      provide: StorageProvider,
      useFactory: (local: LocalDiskStorageService, s3: AwsS3StorageService) => {
        return process.env['NODE_ENV'] === 'production' ? s3 : local;
      },
      inject: [LocalDiskStorageService, AwsS3StorageService],
    },
  ],
  exports: [StorageProvider],
})
export class BackendModule { }
