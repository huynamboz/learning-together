import { Injectable } from '@nestjs/common';
import { ContentStatus, ContentType, MediaStatus, Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { ApiError } from '@/common/http/api-error';
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

  async attachMedia(id: string, assetId: string, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const [content, asset] = await Promise.all([
        tx.contentItem.findUnique({ where: { id }, select: { id: true, type: true, currentVersion: true } }),
        tx.mediaAsset.findUnique({ where: { id: assetId }, select: { id: true, mimeType: true, status: true, visibility: true } })
      ]);
      if (!content) throw new NotFoundException('Không tìm thấy content.');
      if (!asset) throw new NotFoundException('Không tìm thấy asset.');
      if (asset.status !== MediaStatus.READY || asset.visibility !== 'public') throw new ApiError('MEDIA_NOT_PUBLISHABLE', 'Asset phải sẵn sàng và được phát công khai trước khi gắn vào content.', {}, 409);
      const requiredMime = content.type === ContentType.LISTENING ? 'audio/' : content.type === ContentType.VIDEO ? 'video/' : undefined;
      if (!requiredMime) throw new ApiError('UNSUPPORTED_CONTENT_MEDIA', 'Chỉ Listening và Video nhận media trong phase này.', {}, 422);
      if (!asset.mimeType.startsWith(requiredMime)) throw new ApiError('MEDIA_TYPE_MISMATCH', `Content ${content.type} cần asset ${requiredMime}*.`, { mimeType: asset.mimeType }, 422);
      const current = await tx.contentVersion.findUnique({ where: { contentItemId_version: { contentItemId: id, version: content.currentVersion } }, select: { payload: true } });
      if (!current) throw new ApiError('CONTENT_VERSION_MISSING', 'Không tìm thấy version content hiện tại.', {}, 409);
      const payload = isRecord(current.payload) ? { ...current.payload, mediaAssetId: asset.id } : { mediaAssetId: asset.id };
      const nextVersion = content.currentVersion + 1;
      const advanced = await tx.contentItem.updateMany({ where: { id, currentVersion: content.currentVersion }, data: { currentVersion: nextVersion, updatedById: actorId } });
      if (advanced.count !== 1) throw new ApiError('CONTENT_VERSION_CONFLICT', 'Content vừa được thay đổi. Hãy tải lại rồi thử lại.', {}, 409);
      await tx.contentVersion.create({ data: { contentItemId: id, version: nextVersion, payload: payload as Prisma.InputJsonValue, createdById: actorId } });
      await tx.auditLog.create({ data: { actorId, action: 'CONTENT_MEDIA_ATTACHED', entity: 'ContentItem', entityId: id, metadata: { assetId, version: nextVersion } as Prisma.InputJsonValue } });
      return { id, currentVersion: nextVersion, mediaAssetId: asset.id };
    });
  }
}

function isRecord(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
