import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

const groupToRecord = <T extends string>(rows: Array<{ _count?: { _all?: number } | true; status: T }>) => Object.fromEntries(rows.map((row) => [row.status, row._count && row._count !== true ? row._count._all ?? 0 : 0]));

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [users, content, media, imports, writing, reports, orders, recentAudit] = await this.prisma.$transaction([
      this.prisma.user.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } }),
      this.prisma.contentItem.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } }),
      this.prisma.mediaAsset.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } }),
      this.prisma.importBatch.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } }),
      this.prisma.writingSubmission.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } }),
      this.prisma.report.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } }),
      this.prisma.order.groupBy({ by: ['status'], orderBy: { status: 'asc' }, _count: { _all: true } }),
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 12, select: { id: true, action: true, entity: true, entityId: true, createdAt: true } })
    ]);
    return { users: groupToRecord(users), content: groupToRecord(content), media: groupToRecord(media), imports: groupToRecord(imports), writing: groupToRecord(writing), reports: groupToRecord(reports), orders: groupToRecord(orders), recentAudit };
  }

  async users(search = '', limit = 50) {
    const result = await this.prisma.user.findMany({
      where: search ? { OR: [{ email: { contains: search, mode: 'insensitive' } }, { displayName: { contains: search, mode: 'insensitive' } }] } : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      select: { id: true, email: true, displayName: true, status: true, createdAt: true, roles: { include: { role: { select: { name: true } } } }, entitlements: { where: { status: 'ACTIVE' }, take: 1, orderBy: { startsAt: 'desc' }, include: { plan: { select: { code: true } } } } }
    });
    return result.map(({ roles, entitlements, ...user }) => ({ ...user, roles: roles.map(({ role }) => role.name), plan: entitlements[0]?.plan.code ?? 'FREE' }));
  }

  async setUserStatus(id: string, status: UserStatus, actorId: string) {
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({ where: { id }, data: { status }, select: { id: true, email: true, displayName: true, status: true } });
        await tx.auditLog.create({ data: { actorId, action: 'USER_STATUS_UPDATED', entity: 'User', entityId: id, metadata: { status } as Prisma.InputJsonValue } });
        return updated;
      });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') throw new NotFoundException('Không tìm thấy người dùng.');
      throw error;
    }
  }

  audit(limit = 50) { return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(limit, 1), 100), select: { id: true, action: true, entity: true, entityId: true, requestId: true, metadata: true, createdAt: true, actor: { select: { email: true, displayName: true } } } }); }
}
