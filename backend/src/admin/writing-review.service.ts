import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WritingStatus } from '@prisma/client';
import { ApiError } from '@/common/http/api-error';
import { PrismaService } from '@/database/prisma.service';
import { GradeWritingSubmissionDto } from './writing-review.dto';

@Injectable()
export class WritingReviewService {
  constructor(private readonly prisma: PrismaService) {}

  list(status: WritingStatus = WritingStatus.GRADING, limit = 50) {
    return this.prisma.writingSubmission.findMany({
      where: { status },
      orderBy: { submittedAt: 'asc' },
      take: Math.min(Math.max(limit, 1), 100),
      select: {
        id: true,
        part: true,
        body: true,
        wordCount: true,
        status: true,
        submittedAt: true,
        createdAt: true,
        user: { select: { displayName: true, email: true } }
      }
    });
  }

  async grade(id: string, dto: GradeWritingSubmissionDto, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.writingSubmission.findUnique({ where: { id }, select: { id: true, status: true } });
      if (!submission) throw new NotFoundException('Không tìm thấy bài viết.');
      const changed = await tx.writingSubmission.updateMany({ where: { id, status: WritingStatus.GRADING }, data: { status: WritingStatus.GRADED } });
      if (changed.count !== 1) throw new ApiError('WRITING_REVIEW_CLOSED', 'Bài viết không còn ở hàng chờ chấm.', {}, 409);
      const grade = await tx.writingGrade.upsert({
        where: { submissionId: id },
        update: { overall: dto.overall, rubric: dto.rubric as Prisma.InputJsonValue, feedback: dto.feedback as Prisma.InputJsonValue, provider: 'manual-review' },
        create: { submissionId: id, overall: dto.overall, rubric: dto.rubric as Prisma.InputJsonValue, feedback: dto.feedback as Prisma.InputJsonValue, provider: 'manual-review' }
      });
      await tx.auditLog.create({ data: { actorId, action: 'WRITING_GRADED', entity: 'WritingSubmission', entityId: id, metadata: { overall: dto.overall, provider: 'manual-review' } as Prisma.InputJsonValue } });
      return { submissionId: id, status: WritingStatus.GRADED, grade };
    });
  }
}
