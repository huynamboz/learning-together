import { PostStatus } from '@prisma/client';
import { CommunityService } from './community.service';

describe('CommunityService', () => {
  it('resolves feed authors in one batch without changing post order', async () => {
    const prisma = {
      post: { findMany: jest.fn().mockResolvedValue([{ id: 'post-1', authorId: 'author-1', content: 'Need listening help', status: PostStatus.PUBLISHED, tags: ['Listening'], commentCount: 0 }]) },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'author-1', displayName: 'Lan', avatarAssetId: null }]) }
    } as never;
    const result = await new CommunityService(prisma).list();

    expect(result).toEqual([expect.objectContaining({ id: 'post-1', author: { id: 'author-1', displayName: 'Lan', avatarAssetId: null } })]);
    expect((prisma as any).user.findMany).toHaveBeenCalledWith({ where: { id: { in: ['author-1'] } }, select: { id: true, displayName: true, avatarAssetId: true } });
  });

  it('uses a safe fallback author only when the referenced user is unavailable', async () => {
    const prisma = { post: { findMany: jest.fn().mockResolvedValue([{ id: 'post-1', authorId: 'missing', status: PostStatus.PUBLISHED }]) }, user: { findMany: jest.fn().mockResolvedValue([]) } } as never;
    const [post] = await new CommunityService(prisma).list();
    expect(post.author.displayName).toBe('Người học Ms Chole TOEIC');
  });

  it('returns published comments in chronological order with their authors', async () => {
    const prisma = {
      post: { findFirst: jest.fn().mockResolvedValue({ id: 'post-1' }) },
      comment: { findMany: jest.fn().mockResolvedValue([{ id: 'comment-1', authorId: 'author-1', postId: 'post-1', status: PostStatus.PUBLISHED, content: 'Try shadowing.' }]) },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'author-1', displayName: 'Minh', avatarAssetId: null }]) }
    } as never;
    const [comment] = await new CommunityService(prisma).comments('post-1');

    expect(comment).toMatchObject({ id: 'comment-1', author: { displayName: 'Minh' } });
    expect((prisma as any).comment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { postId: 'post-1', status: PostStatus.PUBLISHED }, orderBy: { createdAt: 'asc' }, take: 50 }));
  });
});
