import { ContentType, WritingStatus } from '@prisma/client';
import { LearningService } from './learning.service';
import { surfaceValue } from './surface-progress';

function prismaDouble(results: unknown[]) {
  const calls: Array<Record<string, unknown>> = [];
  const record = (args: Record<string, unknown>) => { calls.push(args); return args; };
  return {
    calls,
    prisma: {
      questionAttempt: { count: jest.fn(record) },
      srsCard: { count: jest.fn(record) },
      writingSubmission: { count: jest.fn(record) },
      studySession: { aggregate: jest.fn(record) },
      examResult: { findMany: jest.fn(record) },
      $transaction: jest.fn(async () => results)
    }
  };
}

describe('lifetime progress per surface', () => {
  it('reports the counters a roadmap needs, without inventing any', async () => {
    const { prisma } = prismaDouble([12, 30, 4, 25, 2, 1, { _sum: { durationSeconds: 900 } }, [{ score: 620 }, { score: 705 }]]);
    await expect(new LearningService(prisma as never).surfaceProgress('user-1')).resolves.toEqual({
      listeningAnswered: 12,
      readingAnswered: 30,
      grammarAnswered: 4,
      vocabularyReviewed: 25,
      writingSubmitted: 2,
      writingGraded: 1,
      videoSeconds: 900,
      examsCompleted: 2,
      bestExamScore: 705
    });
  });

  it('separates Listening from Reading by the question content type, not the attempt context', async () => {
    // Both surfaces record attempts as PRACTICE, so the context alone cannot tell them apart.
    const { prisma, calls } = prismaDouble([0, 0, 0, 0, 0, 0, { _sum: { durationSeconds: null } }, []]);
    await new LearningService(prisma as never).surfaceProgress('user-1');
    const types = calls.slice(0, 3).map((args) => ((args.where as { question: { contentItem: { type: ContentType } } }).question.contentItem.type));
    expect(types).toEqual([ContentType.LISTENING, ContentType.READING, ContentType.GRAMMAR]);
  });

  it('counts a submitted essay as done rather than waiting for a grade', async () => {
    const { prisma, calls } = prismaDouble([0, 0, 0, 0, 0, 0, { _sum: { durationSeconds: 0 } }, []]);
    await new LearningService(prisma as never).surfaceProgress('user-1');
    const submitted = calls[4].where as { status: { in: WritingStatus[] } };
    expect(submitted.status.in).toEqual([WritingStatus.SUBMITTED, WritingStatus.GRADING, WritingStatus.GRADED]);
  });

  it('reports no best score at all rather than a zero the learner never scored', async () => {
    const { prisma } = prismaDouble([0, 0, 0, 0, 0, 0, { _sum: { durationSeconds: null } }, []]);
    await expect(new LearningService(prisma as never).surfaceProgress('user-1')).resolves.toMatchObject({ bestExamScore: null, videoSeconds: 0 });
  });
});

describe('reading one counter by name', () => {
  it('treats a missing snapshot as no progress instead of throwing', () => {
    expect(surfaceValue(null, 'listeningAnswered')).toBe(0);
  });

  it('reads the named counter', () => {
    const progress = { listeningAnswered: 7, readingAnswered: 0, grammarAnswered: 0, vocabularyReviewed: 0, writingSubmitted: 0, writingGraded: 0, videoSeconds: 0, examsCompleted: 0, bestExamScore: null };
    expect(surfaceValue(progress, 'listeningAnswered')).toBe(7);
    expect(surfaceValue(progress, 'bestExamScore')).toBe(0);
  });
});
