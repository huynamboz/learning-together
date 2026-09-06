import { Injectable, NotFoundException } from '@nestjs/common';
import { ExamSessionStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { ApiError } from '@/common/http/api-error';
import { SaveExamAnswerDto, StartExamDto } from './exam.dto';
import { scoreExam, type ExamSectionKindValue, type ScoreConversionRow } from './exam-scoring';

@Injectable()
export class ExamService {
  constructor(private readonly prisma: PrismaService) {}

  async start(userId: string, dto: StartExamDto) {
    const test = await this.prisma.mockTest.findFirst({
      where: { id: dto.testId, status: 'PUBLISHED' },
      include: {
        sections: { orderBy: { sortOrder: 'asc' } },
        questions: {
          orderBy: { sortOrder: 'asc' },
          include: {
            question: {
              select: {
                id: true,
                prompt: true,
                part: true,
                numberInTest: true,
                optionsHidden: true,
                groupId: true,
                options: { orderBy: { sortOrder: 'asc' }, select: { key: true, text: true } }
              }
            }
          }
        }
      }
    });
    if (!test) throw new NotFoundException('Không tìm thấy đề thi.');

    const groupIds = [...new Set(test.questions.map(({ question }) => question.groupId).filter((id): id is string => Boolean(id)))];
    const groups = groupIds.length
      ? await this.prisma.questionGroup.findMany({
        where: { id: { in: groupIds } },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, sectionId: true, type: true, part: true, sortOrder: true,
          stimulus: true, transcript: true, audioAssetId: true, audioStartSec: true, audioEndSec: true,
          media: { orderBy: { sortOrder: 'asc' }, select: { assetId: true, role: true, caption: true, sortOrder: true } }
        }
      })
      : [];

    // A sectioned test is paced by the sum of its sections; a flat one keeps its single duration.
    const durationMin = test.sections.length
      ? test.sections.reduce((total, section) => total + section.durationMin, 0)
      : test.durationMin;

    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + durationMin * 60000);
    const session = await this.prisma.examSession.create({ data: { userId, testId: test.id, mode: dto.mode, startedAt, deadlineAt } });

    return {
      sessionId: session.id,
      mode: session.mode,
      startedAt,
      deadlineAt,
      durationMin,
      sections: test.sections.map(({ id, kind, label, durationMin: minutes, sortOrder }) => ({ id, kind, label, durationMin: minutes, sortOrder })),
      groups,
      questions: test.questions.map(({ question, sectionId }) => ({ ...question, sectionId }))
    };
  }

  async saveAnswer(userId: string, sessionId: string, dto: SaveExamAnswerDto) {
    const session = await this.prisma.examSession.findFirst({ where: { id: sessionId, userId }, include: { test: { include: { questions: true } } } });
    if (!session) throw new NotFoundException('Không tìm thấy phiên làm bài.');
    if (session.status !== ExamSessionStatus.ACTIVE) throw new ApiError('EXAM_SESSION_CLOSED', 'Phiên làm bài đã đóng.', {}, 409);
    if (session.deadlineAt.getTime() <= Date.now()) throw new ApiError('EXAM_TIME_EXPIRED', 'Đã hết thời gian làm bài.', {}, 409);
    if (!session.test.questions.some(({ questionId }) => questionId === dto.questionId)) throw new ApiError('QUESTION_NOT_IN_TEST', 'Câu hỏi không thuộc đề thi này.', {}, 422);
    return this.prisma.examAnswer.upsert({
      where: { sessionId_questionId: { sessionId, questionId: dto.questionId } },
      create: { sessionId, questionId: dto.questionId, selectedAnswer: dto.selectedAnswer, answeredAt: new Date() },
      update: { selectedAnswer: dto.selectedAnswer, answeredAt: new Date() }
    });
  }

  async submit(userId: string, sessionId: string) {
    const session = await this.prisma.examSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        test: {
          include: {
            sections: { select: { id: true, kind: true } },
            conversions: true,
            questions: { include: { question: { select: { id: true, answerKey: true } } } }
          }
        },
        answers: true,
        result: true
      }
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên làm bài.');
    if (session.result) return session.result;

    const sectionKindById = new Map<string, ExamSectionKindValue>(session.test.sections.map((section) => [section.id, section.kind as ExamSectionKindValue]));
    const conversions: ScoreConversionRow[] = session.test.conversions.map((row) => ({ section: row.section as ExamSectionKindValue, rawCorrect: row.rawCorrect, scaled: row.scaled }));

    const result = scoreExam(
      session.test.questions.map(({ question, sectionId }) => ({
        id: question.id,
        answerKey: question.answerKey,
        section: sectionId ? sectionKindById.get(sectionId) ?? null : null
      })),
      session.answers,
      conversions
    );

    return this.prisma.$transaction(async (tx) => {
      for (const answer of session.answers) {
        await tx.examAnswer.update({
          where: { sessionId_questionId: { sessionId, questionId: answer.questionId } },
          data: { isCorrect: isCorrectFromResult(session.test.questions, answer.questionId, answer.selectedAnswer) }
        });
      }
      await tx.examSession.update({ where: { id: sessionId }, data: { status: ExamSessionStatus.SUBMITTED, submittedAt: new Date() } });
      return tx.examResult.create({
        data: {
          sessionId,
          total: result.total,
          correct: result.correct,
          wrong: result.wrong,
          unanswered: result.unanswered,
          score: result.score,
          listeningCorrect: result.listeningCorrect,
          readingCorrect: result.readingCorrect,
          listeningScaled: result.listeningScaled,
          readingScaled: result.readingScaled,
          scoreSource: result.scoreSource,
          durationSec: Math.max(0, Math.round((Date.now() - session.startedAt.getTime()) / 1000))
        }
      });
    });
  }
}

function isCorrectFromResult(questions: Array<{ questionId: string; question: { answerKey: string | null } }>, questionId: string, selectedAnswer: string | null): boolean {
  const question = questions.find(({ questionId: id }) => id === questionId)?.question;
  return Boolean(question?.answerKey && selectedAnswer && question.answerKey.trim().toLowerCase() === selectedAnswer.trim().toLowerCase());
}
