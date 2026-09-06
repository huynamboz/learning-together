import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async xp(limit = 50) {
    const rows = await this.prisma.xpLedger.groupBy({ by: ['userId'], _sum: { amount: true }, orderBy: [{ _sum: { amount: 'desc' } }, { userId: 'asc' }], take: Math.min(Math.max(limit, 1), 100) });
    const users = await this.prisma.user.findMany({ where: { id: { in: rows.map((row) => row.userId) } }, select: { id: true, displayName: true } });
    const names = new Map(users.map((user) => [user.id, user.displayName]));
    return rows.map((row, index) => ({ rank: index + 1, displayName: names.get(row.userId) ?? 'Người học Ms Chole TOEIC', xp: row._sum.amount ?? 0 }));
  }
}
