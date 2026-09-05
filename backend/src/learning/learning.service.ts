import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { isAnswerCorrect } from './answer-evaluator';
import { RecordAttemptDto, RecordStudySessionDto } from './learning.dto';

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

  async recordStudySession(userId: string, dto: RecordStudySessionDto) {
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - dto.durationSeconds * 1000);
    return this.prisma.studySession.create({
      data: { userId, surface: dto.surface, startedAt, endedAt, durationSeconds: dto.durationSeconds },
      select: { id: true, surface: true, durationSeconds: true, endedAt: true }
    });
  }
}
