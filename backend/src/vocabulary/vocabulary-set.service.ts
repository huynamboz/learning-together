import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class VocabularySetService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const sets = await this.prisma.vocabularySet.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: { id: true, slug: true, title: true, description: true, updatedAt: true, _count: { select: { items: true } } }
    });
    return sets.map(({ _count, ...set }) => ({ ...set, wordCount: _count.items }));
  }

  async bySlug(slug: string) {
    const set = await this.prisma.vocabularySet.findFirst({
      where: { slug, status: ContentStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        items: {
          orderBy: { sortOrder: 'asc' },
          select: { sortOrder: true, entry: { select: { id: true, lemma: true, pronunciation: true, partOfSpeech: true, meanings: true, examples: true } } }
        }
      }
    });
    if (!set) throw new NotFoundException('Không tìm thấy bộ từ vựng.');
    const { items, ...rest } = set;
    return { ...rest, wordCount: items.length, words: items.map((item) => ({ ...item.entry, sortOrder: item.sortOrder })) };
  }
}
