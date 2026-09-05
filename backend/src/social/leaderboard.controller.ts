import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {}
  @Get('xp') xp(@Query('limit') limit?: string) { return this.service.xp(Number(limit ?? 50)); }
}
