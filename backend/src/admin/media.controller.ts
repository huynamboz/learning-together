import { Controller, Get, Param, Patch, Query, Req, UseGuards, Body } from '@nestjs/common';
import { MediaStatus, RoleName } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest, RolesGuard } from '@/access/roles.guard';
import { Roles } from '@/access/roles.decorator';
import { UpdateMediaVisibilityDto } from './media.dto';
import { MediaAdminService } from './media.service';

@Controller('admin/media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.CONTENT_EDITOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
export class MediaAdminController {
  constructor(private readonly service: MediaAdminService) {}

  @Get()
  list(@Query('status') status: MediaStatus | undefined, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.service.list(status, Number(page ?? 1), Number(pageSize ?? 50));
  }

  @Patch(':id/visibility')
  setVisibility(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateMediaVisibilityDto) {
    return this.service.setVisibility(id, dto.visibility, request.user!.id);
  }
}
