import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest, RolesGuard } from '@/access/roles.guard';
import { Roles } from '@/access/roles.decorator';
import { UpdateUserStatusDto } from './operations.dto';
import { OperationsService } from './operations.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.MODERATOR)
export class OperationsController {
  constructor(private readonly service: OperationsService) {}

  @Get('overview') overview() { return this.service.overview(); }
  @Get('users') users(@Query('search') search = '', @Query('limit') limit?: string) { return this.service.users(search, Number(limit ?? 50)); }
  @Patch('users/:id/status') setStatus(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateUserStatusDto) { return this.service.setUserStatus(id, dto.status, request.user!.id); }
  @Get('audit') audit(@Query('limit') limit?: string) { return this.service.audit(Number(limit ?? 50)); }
}
