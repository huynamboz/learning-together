import { Controller, Get } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Controller('mock-tests')
export class MockTestController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() { return this.prisma.mockTest.findMany({ where: { status: ContentStatus.PUBLISHED }, orderBy: { updatedAt: 'desc' }, select: { id: true, slug: true, title: true, durationMin: true, _count: { select: { questions: true } } } }).then((tests) => tests.map(({ _count, ...test }) => ({ ...test, questionCount: _count.questions }))); }
}
