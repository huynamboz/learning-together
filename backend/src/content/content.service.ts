import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, ContentType, Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

type Filters = { type?: ContentType; part?: number; level?: number; search?: string };

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: Filters) {
    const where: Prisma.ContentItemWhereInput = {
      status: ContentStatus.PUBLISHED,
      type: filters.type,
      part: filters.part,
      level: filters.level,
      OR: filters.search ? [{ title: { contains: filters.search, mode: 'insensitive' } }, { slug: { contains: filters.search, mode: 'insensitive' } }] : undefined
    };
    const items = await this.prisma.contentItem.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 100, select: { id: true, type: true, title: true, slug: true, part: true, level: true, currentVersion: true, updatedAt: true } });
    return Promise.all(items.map((item) => this.withPayload(item)));
  }

  async bySlug(slug: string) {
    const item = await this.prisma.contentItem.findFirst({ where: { slug, status: ContentStatus.PUBLISHED }, select: { id: true, type: true, title: true, slug: true, part: true, level: true, currentVersion: true, updatedAt: true } });
    if (!item) throw new NotFoundException('Không tìm thấy nội dung.');
    return this.withPayload(item);
  }

  private async withPayload<T extends { id: string; currentVersion: number }>(item: T) {
    const version = await this.prisma.contentVersion.findUnique({ where: { contentItemId_version: { contentItemId: item.id, version: item.currentVersion } }, select: { payload: true } });
    return { ...item, payload: version?.payload ?? {} };
  }
}
