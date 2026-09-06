import { MediaStatus } from '@prisma/client';
import { MediaAdminService } from './media.service';

describe('MediaAdminService', () => {
  it('publishes a ready asset and records the visibility transition', async () => {
    const tx = {
      mediaAsset: {
        findUnique: jest.fn().mockResolvedValue({ id: 'asset-1', status: MediaStatus.READY, visibility: 'private' }),
        update: jest.fn().mockResolvedValue({ id: 'asset-1', status: MediaStatus.READY, visibility: 'public' })
      },
      auditLog: { create: jest.fn() }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) } as never;
    await expect(new MediaAdminService(prisma).setVisibility('asset-1', 'public', 'admin-1')).resolves.toMatchObject({ visibility: 'public' });
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'MEDIA_VISIBILITY_UPDATED' }) }));
  });

  it('refuses to expose an unfinished asset', async () => {
    const tx = { mediaAsset: { findUnique: jest.fn().mockResolvedValue({ id: 'asset-1', status: MediaStatus.PENDING, visibility: 'private' }) } };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) } as never;
    await expect(new MediaAdminService(prisma).setVisibility('asset-1', 'public', 'admin-1')).rejects.toMatchObject({ code: 'MEDIA_NOT_READY' });
  });
});
