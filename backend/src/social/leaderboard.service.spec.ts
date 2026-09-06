import { LeaderboardService } from './leaderboard.service';

describe('LeaderboardService', () => {
  it('returns public display names and never exposes internal user IDs', async () => {
    const prisma = {
      xpLedger: { groupBy: jest.fn().mockResolvedValue([{ userId: 'user-b', _sum: { amount: 30 } }, { userId: 'removed-user', _sum: { amount: 10 } }]) },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'user-b', displayName: 'Mai Anh' }]) }
    } as never;
    await expect(new LeaderboardService(prisma).xp(10)).resolves.toEqual([
      { rank: 1, displayName: 'Mai Anh', xp: 30 },
      { rank: 2, displayName: 'Người học Đậu TOEIC', xp: 10 }
    ]);
    expect((prisma as any).user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['user-b', 'removed-user'] } } }));
  });
});
