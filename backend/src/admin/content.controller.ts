import { ContentStatus, ContentType, RoleName } from '@prisma/client';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest, RolesGuard } from '@/access/roles.guard';
import { Roles } from '@/access/roles.decorator';
import { AttachContentMediaDto, CreateContentDto } from './content.dto';
import { ContentAdminService } from './content.service';

@Controller('admin/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.CONTENT_EDITOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
export class ContentAdminController {
  constructor(private readonly service: ContentAdminService) {}

  @Get()
  list(@Query('status') status: ContentStatus | undefined, @Query('type') type: ContentType | undefined, @Query('search') search = '', @Query('page', new ParseIntPipe({ optional: true })) page = 1, @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize = 50) {
    return this.service.list({ status, type, search, page: Math.max(page, 1), pageSize: Math.min(Math.max(pageSize, 1), 100) });
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateContentDto) { return this.service.createDraft(request.user!.id, dto); }

  @Post(':id/publish')
  publish(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.service.publish(id, request.user!.id); }

  @Patch(':id/media')
  attachMedia(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: AttachContentMediaDto) { return this.service.attachMedia(id, dto.assetId, request.user!.id); }
}
