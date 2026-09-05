import { Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest } from '@/access/roles.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly service: NotificationService) {}
  @Get() list(@Req() request: AuthenticatedRequest, @Query('limit') limit?: string) { return this.service.list(request.user!.id, Number(limit ?? 30)); }
  @Patch('read-all') markAllRead(@Req() request: AuthenticatedRequest) { return this.service.markAllRead(request.user!.id); }
}
