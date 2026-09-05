import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { CreateCommentDto, CreatePostDto } from './community.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  list(cursor?: string, limit = 20) {
    return this.prisma.post.findMany({ where: { status: PostStatus.PUBLISHED }, orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(limit, 1), 50), ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}) });
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
}
