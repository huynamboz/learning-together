import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest } from '@/access/roles.guard';
import { SubmitWritingDto } from './writing.dto';
import { WritingService } from './writing.service';

@Controller('writing/submissions')
@UseGuards(JwtAuthGuard)
export class WritingController {
  constructor(private readonly service: WritingService) {}

  @Post()
  submit(@Req() request: AuthenticatedRequest, @Body() dto: SubmitWritingDto) { return this.service.submit(request.user!.id, dto); }

  @Get(':id')
  get(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.service.get(request.user!.id, id); }
}
