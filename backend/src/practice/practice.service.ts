import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma, QuestionKind } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async questions(filters: { kind?: QuestionKind; part?: number; level?: number; lessonId?: string; limit: number }) {
    const where: Prisma.QuestionWhereInput = { status: ContentStatus.PUBLISHED, kind: filters.kind, part: filters.part, level: filters.level, contentItemId: filters.lessonId };
    const rows = await this.prisma.question.findMany({ where, orderBy: { createdAt: 'asc' }, take: Math.min(Math.max(filters.limit, 1), 100), include: { options: { orderBy: { sortOrder: 'asc' }, select: { key: true, text: true } } } });
    return rows.map((question) => ({ id: question.id, lessonId: question.contentItemId, kind: question.kind, part: question.part, level: question.level, prompt: question.prompt, options: question.options }));
  }
}
