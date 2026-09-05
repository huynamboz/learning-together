import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { CreateContentDto } from './content.dto';

@Injectable()
export class ContentAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createDraft(actorId: string, dto: CreateContentDto) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.contentItem.create({ data: { type: dto.type, title: dto.title, slug: dto.slug, part: dto.part, level: dto.level, createdById: actorId, updatedById: actorId } });
      await tx.contentVersion.create({ data: { contentItemId: item.id, version: 1, createdById: actorId, payload: dto.payload as Prisma.InputJsonValue } });
      return item;
    });
  }

  list(filters: { status?: ContentStatus; type?: string; search?: string; page: number; pageSize: number }) {
    const where: Prisma.ContentItemWhereInput = {
      status: filters.status,
      type: filters.type as Prisma.EnumContentTypeFilter | undefined,
      OR: filters.search ? [{ title: { contains: filters.search, mode: 'insensitive' } }, { slug: { contains: filters.search, mode: 'insensitive' } }] : undefined
    };
    return this.prisma.contentItem.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize, select: { id: true, type: true, title: true, slug: true, part: true, level: true, status: true, currentVersion: true, updatedAt: true } });
  }

  publish(id: string, actorId: string) {
    return this.prisma.contentItem.update({ where: { id }, data: { status: ContentStatus.PUBLISHED, updatedById: actorId } });
  }
}
