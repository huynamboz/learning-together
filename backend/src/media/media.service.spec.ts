import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';
import { OBJECT_STORAGE } from './storage/storage.module';
import { PrismaService } from '@/database/prisma.service';

describe('MediaService', () => {
  it('rejects unsupported media before creating database records', async () => {
    const prisma = { mediaAsset: { create: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [MediaService, { provide: PrismaService, useValue: prisma }, { provide: ConfigService, useValue: { get: () => 'toeic-web' } }, { provide: OBJECT_STORAGE, useValue: { name: 'local' } }]
    }).compile();
    await expect(module.get(MediaService).createUploadSession('user-1', { originalName: 'evil.exe', mimeType: 'application/x-msdownload', byteSize: 10, purpose: 'avatar' })).rejects.toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE' });
    expect(prisma.mediaAsset.create).not.toHaveBeenCalled();
  });
});
