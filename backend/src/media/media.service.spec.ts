import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MediaStatus } from '@prisma/client';
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

  it('accepts a valid filename and purpose before requesting storage instructions', async () => {
    const prisma = { mediaAsset: { create: jest.fn().mockResolvedValue({ id: 'asset-1' }) }, uploadSession: { create: jest.fn().mockResolvedValue({ id: 'session-1' }) } };
    const storage = { name: 'local', createUpload: jest.fn().mockResolvedValue({ mode: 'server', provider: 'local', method: 'POST', expiresAt: new Date('2026-09-06T00:00:00Z') }) };
    const module = await Test.createTestingModule({ providers: [MediaService, { provide: PrismaService, useValue: prisma }, { provide: ConfigService, useValue: { get: () => 'toeic-web' } }, { provide: OBJECT_STORAGE, useValue: storage }] }).compile();
    await expect(module.get(MediaService).createUploadSession('user-1', { originalName: 'lesson.wav', mimeType: 'audio/wav', byteSize: 10, purpose: 'admin-content' })).resolves.toMatchObject({ assetId: 'asset-1', sessionId: 'session-1', mode: 'server' });
  });

  it('opens only a ready public asset and preserves the storage stream metadata', async () => {
    const stream = Readable.from(['audio']);
    const prisma = { mediaAsset: { findUnique: jest.fn().mockResolvedValue({ id: 'asset-1', bucket: 'toeic-web', objectKey: 'media/a.mp3', originalName: 'a.mp3', mimeType: 'audio/mpeg', status: MediaStatus.READY, visibility: 'public' }) } };
    const storage = { name: 'local', getObject: jest.fn().mockResolvedValue({ stream, size: 5 }) };
    const module = await Test.createTestingModule({ providers: [MediaService, { provide: PrismaService, useValue: prisma }, { provide: ConfigService, useValue: { get: () => 'toeic-web' } }, { provide: OBJECT_STORAGE, useValue: storage }] }).compile();
    await expect(module.get(MediaService).openPublicAsset('asset-1')).resolves.toMatchObject({ stream, size: 5, mimeType: 'audio/mpeg', originalName: 'a.mp3' });
    expect(storage.getObject).toHaveBeenCalledWith({ bucket: 'toeic-web', key: 'media/a.mp3' });
  });

  it('does not ask storage for a private asset', async () => {
    const prisma = { mediaAsset: { findUnique: jest.fn().mockResolvedValue({ status: MediaStatus.READY, visibility: 'private' }) } };
    const storage = { name: 'local', getObject: jest.fn() };
    const module = await Test.createTestingModule({ providers: [MediaService, { provide: PrismaService, useValue: prisma }, { provide: ConfigService, useValue: { get: () => 'toeic-web' } }, { provide: OBJECT_STORAGE, useValue: storage }] }).compile();
    await expect(module.get(MediaService).openPublicAsset('asset-1')).rejects.toThrow('Asset không sẵn sàng để phát.');
    expect(storage.getObject).not.toHaveBeenCalled();
  });

  it('removes the temporary server-upload file even when the upload session is invalid', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'toeic-upload-cleanup-'));
    const filePath = join(directory, 'upload.wav');
    await writeFile(filePath, 'audio');
    const prisma = { uploadSession: { findFirst: jest.fn().mockResolvedValue(null) } };
    const storage = { name: 'local' };
    const module = await Test.createTestingModule({ providers: [MediaService, { provide: PrismaService, useValue: prisma }, { provide: ConfigService, useValue: { get: () => 'toeic-web' } }, { provide: OBJECT_STORAGE, useValue: storage }] }).compile();
    await expect(module.get(MediaService).uploadServerFile('user-1', 'missing', filePath, 'audio/wav', 10)).rejects.toThrow('Không tìm thấy upload session.');
    await expect(stat(filePath)).rejects.toMatchObject({ code: 'ENOENT' });
    await rm(directory, { recursive: true, force: true });
  });
});
