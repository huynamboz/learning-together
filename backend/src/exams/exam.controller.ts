import { Body, Controller, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest } from '@/access/roles.guard';
import { ExamService } from './exam.service';
import { SaveExamAnswerDto, StartExamDto } from './exam.dto';

@Controller('exam-sessions')
@UseGuards(JwtAuthGuard)
export class ExamController {
  constructor(private readonly service: ExamService) {}

  @Post()
  start(@Req() request: AuthenticatedRequest, @Body() dto: StartExamDto) { return this.service.start(request.user!.id, dto); }

  @Patch(':id/answers')
  answer(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: SaveExamAnswerDto) { return this.service.saveAnswer(request.user!.id, id, dto); }

  @Post(':id/submit')
  submit(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.service.submit(request.user!.id, id); }
}
