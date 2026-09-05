import { ContentStatus, ContentType } from '@prisma/client';
import { ContentService } from './content.service';

describe('ContentService', () => {
  it('returns only published items with their current version payload', async () => {
    const prisma = {
      contentItem: { findMany: jest.fn().mockResolvedValue([{ id: 'item-1', type: ContentType.LISTENING, title: 'Office', slug: 'office', part: 1, level: 1, currentVersion: 2, updatedAt: new Date() }]) },
      contentVersion: { findUnique: jest.fn().mockResolvedValue({ payload: { audio: 'office.mp3' } }) }
    } as never;
    const result = await new ContentService(prisma).list({ type: ContentType.LISTENING, part: 1 });
    expect(result[0]).toMatchObject({ title: 'Office', payload: { audio: 'office.mp3' } });
    expect((prisma as any).contentItem.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: ContentStatus.PUBLISHED, type: ContentType.LISTENING, part: 1 }) }));
  });
});
