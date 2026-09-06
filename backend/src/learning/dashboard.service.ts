import { Injectable } from '@nestjs/common';
import { AttemptContext } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

const DAY_MS = 86400000;

const goalDefinitions = [
  { key: 'listening', label: 'Nghe', target: 1800, unit: 'giây', icon: '◌', tone: 'leaf', to: '/listen' },
  { key: 'reading', label: 'Đọc', target: 30, unit: 'câu', icon: '▦', tone: 'iris', to: '/read' },
  { key: 'vocabulary', label: 'Từ vựng', target: 20, unit: 'thẻ', icon: '▤', tone: 'bean', to: '/vocabulary' },
  { key: 'mock-test', label: 'Luyện đề', target: 40, unit: 'câu', icon: '▥', tone: 'ink', to: '/mock-test' },
  { key: 'video', label: 'Video', target: 1200, unit: 'giây', icon: '▷', tone: 'pink', to: '/video' }
] as const;

type GoalKey = (typeof goalDefinitions)[number]['key'];

export function utcDayStart(value = new Date()): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function utcDayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function streakFromDates(now: Date, dates: Date[]): number {
  const activeDays = new Set(dates.map(utcDayKey));
  let cursor = utcDayStart(now);
  let streak = 0;
  while (activeDays.has(utcDayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

export function chooseNextAction(input: { dueVocabulary: number; listening: number; reading: number; mockTest: number }) {
  if (input.dueVocabulary > 0) return { surface: 'vocabulary', to: '/vocabulary', title: `Ôn ${input.dueVocabulary} thẻ đến hạn`, detail: 'Một vòng SRS ngắn sẽ giữ nhịp nhớ từ.' };
  if (input.listening < 1800) return { surface: 'listening', to: '/listen', title: 'Nghe thêm một đoạn ngắn', detail: 'Mục tiêu hôm nay còn thời lượng Listening.' };
  if (input.reading < 30) return { surface: 'reading', to: '/read', title: 'Làm một câu Reading', detail: 'Một câu có giải thích là đủ để nối nhịp đọc.' };
  if (input.mockTest < 40) return { surface: 'mock-test', to: '/mock-test', title: 'Tiếp tục mini test', detail: 'Tổng hợp phản xạ bằng vài câu đề ngắn.' };
  return { surface: 'review', to: '/vocabulary', title: 'Giữ nhịp bằng một vòng ôn', detail: 'Bạn đã hoàn thành mục tiêu hôm nay; ôn nhẹ để củng cố.' };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async snapshot(userId: string) {
    const now = new Date();
    const dayStart = utcDayStart(now);
    const historyStart = new Date(dayStart.getTime() - 59 * DAY_MS);
    const [totalAttempts, correctAttempts, dailyAttempts, mockAttempts, dailyStudy, studyHistory, attemptHistory, dueVocabulary, reviewedVocabulary, vocabularyHistory, lastExam, totalXp, writing,] = await this.prisma.$transaction([
      this.prisma.questionAttempt.count({ where: { userId } }),
      this.prisma.questionAttempt.count({ where: { userId, isCorrect: true } }),
      this.prisma.questionAttempt.count({ where: { userId, createdAt: { gte: dayStart } } }),
      this.prisma.questionAttempt.count({ where: { userId, context: AttemptContext.EXAM, createdAt: { gte: dayStart } } }),
      this.prisma.studySession.groupBy({ by: ['surface'], where: { userId, startedAt: { gte: dayStart } }, orderBy: { surface: 'asc' }, _sum: { durationSeconds: true } }),
      this.prisma.studySession.findMany({ where: { userId, startedAt: { gte: historyStart } }, orderBy: { startedAt: 'desc' }, take: 60, select: { surface: true, durationSeconds: true, startedAt: true, endedAt: true } }),
      this.prisma.questionAttempt.findMany({ where: { userId, createdAt: { gte: historyStart } }, orderBy: { createdAt: 'desc' }, take: 60, select: { isCorrect: true, context: true, createdAt: true } }),
      this.prisma.srsCard.count({ where: { userId, dueAt: { lte: now } } }),
      this.prisma.srsCard.count({ where: { userId, lastReviewedAt: { gte: dayStart } } }),
      this.prisma.srsCard.findMany({ where: { userId, lastReviewedAt: { gte: historyStart } }, orderBy: { lastReviewedAt: 'desc' }, take: 60, select: { lastReviewedAt: true } }),
      this.prisma.examResult.findFirst({ where: { session: { userId } }, orderBy: { createdAt: 'desc' }, select: { total: true, correct: true, score: true, createdAt: true } }),
      this.prisma.xpLedger.aggregate({ where: { userId }, _sum: { amount: true } }),
      this.prisma.writingSubmission.groupBy({ by: ['status'], where: { userId }, orderBy: { status: 'asc' }, _count: { _all: true } })
    ]);
    const studyBySurface = new Map(dailyStudy.map((row) => [row.surface, row._sum?.durationSeconds ?? 0]));
    const achieved: Record<GoalKey, number> = {
      listening: studyBySurface.get('listening') ?? 0,
      reading: dailyAttempts,
      vocabulary: reviewedVocabulary,
      'mock-test': mockAttempts,
      video: studyBySurface.get('video') ?? 0
    };
    const activityDates = [
      ...studyHistory.map((row) => row.startedAt),
      ...attemptHistory.map((row) => row.createdAt),
      ...vocabularyHistory.flatMap((row) => row.lastReviewedAt ? [row.lastReviewedAt] : [])
    ];
    const recentActivity = [
      ...studyHistory.map((row) => ({ kind: 'study', surface: row.surface, quantity: row.durationSeconds, occurredAt: row.endedAt ?? row.startedAt })),
      ...attemptHistory.map((row) => ({ kind: 'attempt', surface: row.context.toLowerCase(), quantity: 1, isCorrect: row.isCorrect, occurredAt: row.createdAt })),
      ...vocabularyHistory.flatMap((row) => row.lastReviewedAt ? [{ kind: 'vocabulary', surface: 'vocabulary', quantity: 1, occurredAt: row.lastReviewedAt }] : []),
      ...(lastExam ? [{ kind: 'exam', surface: 'mock-test', quantity: lastExam.total, correct: lastExam.correct, occurredAt: lastExam.createdAt }] : [])
    ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, 8);
    const writingByStatus = Object.fromEntries(writing.map((row) => [row.status, row._count && row._count !== true ? row._count._all ?? 0 : 0]));
    return {
      dayStart: dayStart.toISOString(),
      metrics: {
        totalAttempts,
        correctAttempts,
        wrongAttempts: totalAttempts - correctAttempts,
        accuracy: totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
        studySecondsToday: [...studyBySurface.values()].reduce((sum, seconds) => sum + seconds, 0),
        xp: totalXp._sum.amount ?? 0,
        streakDays: streakFromDates(now, activityDates),
        dueVocabulary,
        writing: { grading: writingByStatus.GRADING ?? 0, graded: writingByStatus.GRADED ?? 0 },
        lastExam
      },
      goals: goalDefinitions.map((goal) => ({ ...goal, achieved: achieved[goal.key] })),
      recentActivity,
      nextAction: chooseNextAction({ dueVocabulary, listening: achieved.listening, reading: achieved.reading, mockTest: achieved['mock-test'] })
    };
  }
}
