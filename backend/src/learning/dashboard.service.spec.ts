import { DashboardService, chooseNextAction, streakFromDates } from './dashboard.service';

describe('DashboardService helpers', () => {
  it('counts only uninterrupted UTC activity dates for a streak', () => {
    const now = new Date('2026-09-06T15:00:00.000Z');
    expect(streakFromDates(now, [new Date('2026-09-06T01:00:00.000Z'), new Date('2026-09-05T23:00:00.000Z'), new Date('2026-09-03T10:00:00.000Z')])).toBe(2);
  });

  it('prioritizes due SRS cards before all other next actions', () => {
    expect(chooseNextAction({ dueVocabulary: 3, listening: 0, reading: 0, mockTest: 0 })).toMatchObject({ surface: 'vocabulary', to: '/vocabulary' });
  });
});

describe('DashboardService snapshot', () => {
  it('returns an honest zero-data owner snapshot with the first study action', async () => {
    const prisma = {
      $transaction: jest.fn().mockResolvedValue([0, 0, 0, 0, [], [], [], 0, 0, [], null, { _sum: { amount: null } }, []]),
      questionAttempt: { count: jest.fn(), findMany: jest.fn() },
      studySession: { groupBy: jest.fn(), findMany: jest.fn() },
      srsCard: { count: jest.fn(), findMany: jest.fn() },
      examResult: { findFirst: jest.fn() },
      xpLedger: { aggregate: jest.fn() },
      writingSubmission: { groupBy: jest.fn() }
    } as never;
    const snapshot = await new DashboardService(prisma).snapshot('user-1');
    expect(snapshot.metrics).toMatchObject({ totalAttempts: 0, accuracy: 0, studySecondsToday: 0, xp: 0, streakDays: 0 });
    expect(snapshot.nextAction).toMatchObject({ surface: 'listening', to: '/listen' });
    expect(snapshot.goals).toHaveLength(5);
  });
});
