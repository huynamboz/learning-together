import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest } from '@/access/roles.guard';
import { RecordAttemptDto, RecordStudySessionDto } from './learning.dto';
import { LearningService } from './learning.service';
import { DashboardService } from './dashboard.service';

@Controller('learning')
@UseGuards(JwtAuthGuard)
export class LearningController {
  constructor(private readonly service: LearningService, private readonly dashboard: DashboardService) {}

  @Post('attempts')
  record(@Req() request: AuthenticatedRequest, @Body() dto: RecordAttemptDto) { return this.service.recordAttempt(request.user!.id, dto); }

  @Post('study-sessions')
  recordStudySession(@Req() request: AuthenticatedRequest, @Body() dto: RecordStudySessionDto) { return this.service.recordStudySession(request.user!.id, dto); }

  @Get('progress')
  getProgress(@Req() request: AuthenticatedRequest) { return this.service.progress(request.user!.id); }

  @Get('surface-progress')
  surfaceProgress(@Req() request: AuthenticatedRequest) { return this.service.surfaceProgress(request.user!.id); }

  @Get('dashboard')
  dashboardSnapshot(@Req() request: AuthenticatedRequest) { return this.dashboard.snapshot(request.user!.id); }
}
