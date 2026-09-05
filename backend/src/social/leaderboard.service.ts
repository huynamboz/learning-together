import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async xp(limit = 50) {
    const rows = await this.prisma.xpLedger.groupBy({ by: ['userId'], _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } }, take: Math.min(Math.max(limit, 1), 100) });
    return rows.map((row, index) => ({ rank: index + 1, userId: row.userId, xp: row._sum.amount ?? 0 }));
  }
}
