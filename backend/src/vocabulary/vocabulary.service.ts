import { Injectable, NotFoundException } from '@nestjs/common';
import { SrsState } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { ReviewVocabularyDto } from './vocabulary.dto';
import { scheduleReview } from './srs';

@Injectable()
export class VocabularyService {
  constructor(private readonly prisma: PrismaService) {}

  async review(userId: string, dto: ReviewVocabularyDto) {
    const entry = await this.prisma.vocabularyEntry.findUnique({ where: { id: dto.entryId }, select: { id: true } });
    if (!entry) throw new NotFoundException('Không tìm thấy từ vựng.');
    const current = await this.prisma.srsCard.findUnique({ where: { userId_entryId: { userId, entryId: dto.entryId } } });
    const schedule = scheduleReview({ state: (current?.state ?? SrsState.NEW) as SrsState, intervalDays: current?.intervalDays ?? 0, ease: current?.ease ?? 2.5, repetitions: current?.repetitions ?? 0, lapses: current?.lapses ?? 0 }, dto.rating);
    return this.prisma.srsCard.upsert({ where: { userId_entryId: { userId, entryId: dto.entryId } }, create: { userId, entryId: dto.entryId, state: schedule.state, intervalDays: schedule.intervalDays, ease: schedule.ease, repetitions: schedule.repetitions, lapses: schedule.lapses, dueAt: schedule.dueAt, lastReviewedAt: new Date() }, update: { state: schedule.state, intervalDays: schedule.intervalDays, ease: schedule.ease, repetitions: schedule.repetitions, lapses: schedule.lapses, dueAt: schedule.dueAt, lastReviewedAt: new Date() } });
  }

  queue(userId: string, limit = 20) { return this.prisma.srsCard.findMany({ where: { userId, dueAt: { lte: new Date() }, state: { not: SrsState.MASTERED } }, orderBy: { dueAt: 'asc' }, take: Math.min(Math.max(limit, 1), 100), include: { entry: true } }); }
}
