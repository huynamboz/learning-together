import { ContentStatus, ContentType, MediaStatus } from '@prisma/client';
import { ContentAdminService } from './content.service';

describe('ContentAdminService', () => {
  it('creates a new version when attaching a matching public media asset', async () => {
    const tx = {
      contentItem: {
        findUnique: jest.fn().mockResolvedValue({ id: 'content-1', type: ContentType.LISTENING, currentVersion: 2 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      mediaAsset: { findUnique: jest.fn().mockResolvedValue({ id: 'asset-1', mimeType: 'audio/mpeg', status: MediaStatus.READY, visibility: 'public' }) },
      contentVersion: { findUnique: jest.fn().mockResolvedValue({ payload: { transcript: 'Listen carefully.' } }), create: jest.fn() },
      auditLog: { create: jest.fn() }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) } as never;
    await expect(new ContentAdminService(prisma).attachMedia('content-1', 'asset-1', 'admin-1')).resolves.toEqual({ id: 'content-1', currentVersion: 3, mediaAssetId: 'asset-1' });
    expect(tx.contentItem.updateMany).toHaveBeenCalledWith({ where: { id: 'content-1', currentVersion: 2 }, data: { currentVersion: 3, updatedById: 'admin-1' } });
    expect(tx.contentVersion.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ version: 3, payload: { transcript: 'Listen carefully.', mediaAssetId: 'asset-1' } }) }));
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'CONTENT_MEDIA_ATTACHED' }) }));
  });

  it('rejects media with an incompatible MIME type before versioning', async () => {
    const tx = {
      contentItem: { findUnique: jest.fn().mockResolvedValue({ id: 'content-1', type: ContentType.LISTENING, currentVersion: 1 }) },
      mediaAsset: { findUnique: jest.fn().mockResolvedValue({ id: 'asset-1', mimeType: 'video/mp4', status: MediaStatus.READY, visibility: 'public' }) }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) } as never;
    await expect(new ContentAdminService(prisma).attachMedia('content-1', 'asset-1', 'admin-1')).rejects.toMatchObject({ code: 'MEDIA_TYPE_MISMATCH' });
  });

  it('keeps standard publish behavior', async () => {
    const prisma = { contentItem: { update: jest.fn().mockResolvedValue({ id: 'content-1', status: ContentStatus.PUBLISHED }) } } as never;
    await expect(new ContentAdminService(prisma).publish('content-1', 'admin-1')).resolves.toMatchObject({ status: ContentStatus.PUBLISHED });
  });
});
