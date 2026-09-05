import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { CreateCommentDto, CreatePostDto } from './community.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async list(cursor?: string, limit = 20) {
    const posts = await this.prisma.post.findMany({ where: { status: PostStatus.PUBLISHED }, orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(limit, 1), 50), ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
    const authorById = await this.authorsById(posts.map(({ authorId }) => authorId));
    return posts.map((post) => ({ ...post, author: authorById.get(post.authorId) ?? { id: post.authorId, displayName: 'Người học Đậu TOEIC', avatarAssetId: null } }));
  }

  createPost(authorId: string, dto: CreatePostDto) { return this.prisma.post.create({ data: { authorId, type: dto.type, content: dto.content.trim(), tags: dto.tags ?? [] } }); }

  async comment(authorId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, status: PostStatus.PUBLISHED }, select: { id: true } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng.');
    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({ data: { postId, authorId, parentId: dto.parentId, content: dto.content.trim() } });
      await tx.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
      return created;
    });
    return comment;
  }

  async comments(postId: string, limit = 50) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, status: PostStatus.PUBLISHED }, select: { id: true } });
    if (!post) throw new NotFoundException('Không tìm thấy bài đăng.');
    const comments = await this.prisma.comment.findMany({ where: { postId, status: PostStatus.PUBLISHED }, orderBy: { createdAt: 'asc' }, take: Math.min(Math.max(limit, 1), 100) });
    const authorById = await this.authorsById(comments.map(({ authorId }) => authorId));
    return comments.map((comment) => ({ ...comment, author: authorById.get(comment.authorId) ?? { id: comment.authorId, displayName: 'Người học Đậu TOEIC', avatarAssetId: null } }));
  }

  private async authorsById(authorIds: string[]) {
    const uniqueIds = [...new Set(authorIds)];
    const authors = uniqueIds.length ? await this.prisma.user.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, displayName: true, avatarAssetId: true } }) : [];
    return new Map(authors.map((author) => [author.id, author]));
  }
}
