import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma, QuestionKind } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async questions(filters: { kind?: QuestionKind; part?: number; level?: number; lessonId?: string; limit: number }) {
    const where: Prisma.QuestionWhereInput = { status: ContentStatus.PUBLISHED, kind: filters.kind, part: filters.part, level: filters.level, contentItemId: filters.lessonId };
    const rows = await this.prisma.question.findMany({
      where,
      orderBy: [{ groupId: 'asc' }, { numberInTest: 'asc' }, { createdAt: 'asc' }],
      take: Math.min(Math.max(filters.limit, 1), 100),
      include: {
        options: { orderBy: { sortOrder: 'asc' }, select: { key: true, text: true } },
        group: {
          select: {
            id: true, type: true, part: true, sortOrder: true, stimulus: true, transcript: true,
            audioAssetId: true, audioStartSec: true, audioEndSec: true,
            media: { orderBy: { sortOrder: 'asc' }, select: { assetId: true, role: true, caption: true, sortOrder: true } }
          }
        }
      }
    });
    return rows.map((question) => ({
      id: question.id,
      lessonId: question.contentItemId,
      groupId: question.groupId,
      kind: question.kind,
      part: question.part,
      level: question.level,
      numberInTest: question.numberInTest,
      // Part 1 and 2 print no answer text; the runner shows bare letters instead.
      optionsHidden: question.optionsHidden,
      prompt: question.prompt,
      options: question.options,
      group: question.group
    }));
  }
}
