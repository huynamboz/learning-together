import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaStatus, Prisma } from '@prisma/client';
import { ApiError } from '@/common/http/api-error';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class MediaAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: MediaStatus, page = 1, pageSize = 50) {
    const assets = await this.prisma.mediaAsset.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      skip: (Math.max(page, 1) - 1) * Math.min(Math.max(pageSize, 1), 100),
      take: Math.min(Math.max(pageSize, 1), 100),
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        byteSize: true,
        status: true,
        visibility: true,
        createdAt: true,
        owner: { select: { displayName: true, email: true } }
      }
    });
    return assets.map(({ byteSize, ...asset }) => ({ ...asset, byteSize: Number(byteSize) }));
  }

  async setVisibility(id: string, visibility: 'public' | 'private', actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const asset = await tx.mediaAsset.findUnique({ where: { id }, select: { id: true, status: true, visibility: true } });
      if (!asset) throw new NotFoundException('Không tìm thấy asset.');
      if (visibility === 'public' && asset.status !== MediaStatus.READY) {
        throw new ApiError('MEDIA_NOT_READY', 'Chỉ asset sẵn sàng mới có thể phát công khai.', {}, 409);
      }
      const updated = await tx.mediaAsset.update({ where: { id }, data: { visibility }, select: { id: true, visibility: true, status: true } });
      await tx.auditLog.create({ data: { actorId, action: 'MEDIA_VISIBILITY_UPDATED', entity: 'MediaAsset', entityId: id, metadata: { from: asset.visibility, to: visibility } as Prisma.InputJsonValue } });
      return updated;
    });
  }
}
