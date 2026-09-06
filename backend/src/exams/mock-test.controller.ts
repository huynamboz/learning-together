import { Controller, Get } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Controller('mock-tests')
export class MockTestController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const tests = await this.prisma.mockTest.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        durationMin: true,
        sections: { orderBy: { sortOrder: 'asc' }, select: { id: true, kind: true, label: true, durationMin: true } },
        _count: { select: { questions: true, conversions: true } }
      }
    });
    return tests.map(({ _count, sections, durationMin, ...test }) => ({
      ...test,
      sections,
      // A sectioned form is paced by its sections; a flat one keeps its single duration.
      durationMin: sections.length ? sections.reduce((total, section) => total + section.durationMin, 0) : durationMin,
      questionCount: _count.questions,
      /// True when the form publishes its own raw-to-scaled table, so results are not an estimate.
      hasScoreTable: _count.conversions > 0
    }));
  }
}
