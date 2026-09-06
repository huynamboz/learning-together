import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RoleName, WritingStatus } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest, RolesGuard } from '@/access/roles.guard';
import { Roles } from '@/access/roles.decorator';
import { GradeWritingSubmissionDto } from './writing-review.dto';
import { WritingReviewService } from './writing-review.service';

@Controller('admin/writing/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN, RoleName.MODERATOR)
export class WritingReviewController {
  constructor(private readonly service: WritingReviewService) {}

  @Get()
  list(@Query('status') status?: WritingStatus, @Query('limit') limit?: string) {
    return this.service.list(status ?? WritingStatus.GRADING, Number(limit ?? 50));
  }

  @Post(':id/grade')
  grade(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: GradeWritingSubmissionDto) {
    return this.service.grade(id, dto, request.user!.id);
  }
}
