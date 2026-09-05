import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';

@Module({ imports: [AuthModule], controllers: [CommunityController, NotificationController, LeaderboardController], providers: [CommunityService, NotificationService, LeaderboardService] })
export class SocialModule {}
