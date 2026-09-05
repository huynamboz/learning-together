import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest } from '@/access/roles.guard';
import { ReviewVocabularyDto } from './vocabulary.dto';
import { VocabularyService } from './vocabulary.service';

@Controller('vocabulary')
@UseGuards(JwtAuthGuard)
export class VocabularyController {
  constructor(private readonly service: VocabularyService) {}

  @Get('review-queue')
  queue(@Req() request: AuthenticatedRequest, @Query('limit') limit?: string) { return this.service.queue(request.user!.id, Number(limit ?? 20)); }

  @Post('reviews')
  review(@Req() request: AuthenticatedRequest, @Body() dto: ReviewVocabularyDto) { return this.service.review(request.user!.id, dto); }
}
