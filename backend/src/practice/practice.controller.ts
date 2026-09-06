import { Controller, Get, Query } from '@nestjs/common';
import { QuestionKind } from '@prisma/client';
import { PracticeService } from './practice.service';

@Controller('practice')
export class PracticeController {
  constructor(private readonly service: PracticeService) {}

  @Get('questions')
  questions(@Query('kind') kind?: QuestionKind, @Query('part') part?: string, @Query('level') level?: string, @Query('lessonId') lessonId?: string, @Query('limit') limit?: string) {
    return this.service.questions({ kind, part: part ? Number(part) : undefined, level: level ? Number(level) : undefined, lessonId, limit: Number(limit ?? 20) });
  }
}
