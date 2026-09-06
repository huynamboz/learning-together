import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentType, WritingStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { isAnswerCorrect } from './answer-evaluator';
import { RecordAttemptDto, RecordStudySessionDto } from './learning.dto';
import type { SurfaceProgress } from './surface-progress';

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAttempt(userId: string, dto: RecordAttemptDto) {
    const question = await this.prisma.question.findUnique({ where: { id: dto.questionId }, select: { id: true, answerKey: true } });
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi.');
    const correct = isAnswerCorrect(question.answerKey, dto.selectedAnswer);
    const attempt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.questionAttempt.create({ data: { userId, questionId: dto.questionId, context: dto.context, contextId: dto.contextId, selectedAnswer: dto.selectedAnswer, isCorrect: correct, timeMs: dto.timeMs } });
      await tx.questionProgress.upsert({ where: { userId_questionId: { userId, questionId: dto.questionId } }, create: { userId, questionId: dto.questionId, seenCount: 1, correctCount: correct ? 1 : 0, wrongCount: correct ? 0 : 1, lastSeenAt: new Date() }, update: { seenCount: { increment: 1 }, correctCount: { increment: correct ? 1 : 0 }, wrongCount: { increment: correct ? 0 : 1 }, lastSeenAt: new Date() } });
      return created;
    });
    return { attemptId: attempt.id, isCorrect: correct };
  }

  async progress(userId: string) {
    const [aggregate, correct, wrong] = await this.prisma.$transaction([
      this.prisma.questionAttempt.count({ where: { userId } }),
      this.prisma.questionAttempt.count({ where: { userId, isCorrect: true } }),
      this.prisma.questionAttempt.count({ where: { userId, isCorrect: false } })
    ]);
    return { total: aggregate, correct, wrong, accuracy: aggregate ? Math.round((correct / aggregate) * 100) : 0 };
  }

  /**
   * Lifetime totals per surface. Counting through the question's content type rather than the
   * attempt's own context is what separates Listening from Reading — both are recorded as
   * PRACTICE, so the context alone cannot tell them apart.
   */
  async surfaceProgress(userId: string): Promise<SurfaceProgress> {
    const answered = (type: ContentType) => this.prisma.questionAttempt.count({ where: { userId, question: { contentItem: { type } } } });
    const [listeningAnswered, readingAnswered, grammarAnswered, vocabularyReviewed, writingSubmitted, writingGraded, videoStudy, exams] = await this.prisma.$transaction([
      answered(ContentType.LISTENING),
      answered(ContentType.READING),
      answered(ContentType.GRAMMAR),
      this.prisma.srsCard.count({ where: { userId, lastReviewedAt: { not: null } } }),
      this.prisma.writingSubmission.count({ where: { userId, status: { in: [WritingStatus.SUBMITTED, WritingStatus.GRADING, WritingStatus.GRADED] } } }),
      this.prisma.writingSubmission.count({ where: { userId, status: WritingStatus.GRADED } }),
      this.prisma.studySession.aggregate({ where: { userId, surface: 'video' }, _sum: { durationSeconds: true } }),
      this.prisma.examResult.findMany({ where: { session: { userId } }, select: { score: true } })
    ]);

    return {
      listeningAnswered,
      readingAnswered,
      grammarAnswered,
      vocabularyReviewed,
      writingSubmitted,
      writingGraded,
      videoSeconds: videoStudy._sum.durationSeconds ?? 0,
      examsCompleted: exams.length,
      bestExamScore: exams.length ? Math.max(...exams.map((exam) => exam.score ?? 0)) : null
    };
  }

  async recordStudySession(userId: string, dto: RecordStudySessionDto) {
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - dto.durationSeconds * 1000);
    return this.prisma.studySession.create({
      data: { userId, surface: dto.surface, startedAt, endedAt, durationSeconds: dto.durationSeconds },
      select: { id: true, surface: true, durationSeconds: true, endedAt: true }
    });
  }
}
