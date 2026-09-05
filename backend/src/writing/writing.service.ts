import { Injectable, NotFoundException } from '@nestjs/common';
import { AiCreditLedger, CreditEntryType, Prisma, WritingStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { ApiError } from '@/common/http/api-error';
import { SubmitWritingDto } from './writing.dto';

export function countWords(body: string): number { return body.trim() ? body.trim().split(/\s+/u).length : 0; }

@Injectable()
export class WritingService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(userId: string, dto: SubmitWritingDto) {
    const wordCount = countWords(dto.body);
    if (!wordCount) throw new ApiError('EMPTY_WRITING', 'Bài viết không được để trống.', {}, 422);
    return this.prisma.$transaction(async (tx) => {
      const balance = await this.balance(tx, userId);
      if (balance < 1) throw new ApiError('AI_CREDIT_REQUIRED', 'Bạn đã hết lượt chấm AI.', { balance }, 402);
      const submission = await tx.writingSubmission.create({ data: { userId, promptId: dto.promptId, part: dto.part, body: dto.body, wordCount, status: WritingStatus.GRADING, submittedAt: new Date() } });
      await tx.aiCreditLedger.create({ data: { userId, type: CreditEntryType.CONSUME, amount: -1, balanceAfter: balance - 1, referenceId: submission.id, metadata: { purpose: 'writing_grading' } as Prisma.InputJsonValue } });
      return { submissionId: submission.id, status: submission.status, creditsRemaining: balance - 1 };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  get(userId: string, id: string) { return this.prisma.writingSubmission.findFirst({ where: { id, userId }, include: { grade: true } }).then((submission) => { if (!submission) throw new NotFoundException('Không tìm thấy bài viết.'); return submission; }); }

  private async balance(tx: Prisma.TransactionClient, userId: string): Promise<number> {
    const result = await tx.aiCreditLedger.aggregate({ where: { userId }, _sum: { amount: true } });
    return result._sum.amount ?? 0;
  }
}
