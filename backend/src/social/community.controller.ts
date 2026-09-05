import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest } from '@/access/roles.guard';
import { CreateCommentDto, CreatePostDto } from './community.dto';
import { CommunityService } from './community.service';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  @Get('posts')
  list(@Query('cursor') cursor?: string, @Query('limit') limit?: string) { return this.service.list(cursor, Number(limit ?? 20)); }

  @Post('posts')
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreatePostDto) { return this.service.createPost(request.user!.id, dto); }

  @Post('posts/:id/comments')
  comment(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: CreateCommentDto) { return this.service.comment(request.user!.id, id, dto); }
}
