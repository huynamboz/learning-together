import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorage } from './local.storage';
import { S3CompatibleStorage } from './s3-compatible.storage';
import type { ObjectStorage, StorageProviderName } from './storage.types';

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

@Module({
  providers: [
    {
      provide: OBJECT_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): ObjectStorage => {
        const provider = config.get<string>('storage.provider', 'local') as StorageProviderName;
        const storage = config.get<Record<string, string | undefined>>('storage', {});
        if (provider === 'local') return new LocalStorage(storage.localRoot ?? './storage');
        if (provider === 'r2') return new S3CompatibleStorage({ name: 'r2', endpoint: storage.r2Endpoint, region: 'auto', accessKeyId: storage.r2AccessKeyId ?? '', secretAccessKey: storage.r2SecretAccessKey ?? '' });
        return new S3CompatibleStorage({ name: 's3', endpoint: storage.endpoint, region: storage.region ?? 'auto', accessKeyId: storage.accessKeyId ?? '', secretAccessKey: storage.secretAccessKey ?? '' });
      }
    }
  ],
  exports: [OBJECT_STORAGE]
})
export class StorageModule {}
