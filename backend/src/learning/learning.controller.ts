import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest } from '@/access/roles.guard';
import { RecordAttemptDto } from './learning.dto';
import { LearningService } from './learning.service';

@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private readonly service: LearningService) {}

  @Post('attempts')
  record(@Req() request: AuthenticatedRequest, @Body() dto: RecordAttemptDto) { return this.service.recordAttempt(request.user!.id, dto); }

  @Get('progress')
  getProgress(@Req() request: AuthenticatedRequest) { return this.service.progress(request.user!.id); }
}
