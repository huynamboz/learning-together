import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { MockTestController } from './mock-test.controller';

@Module({ imports: [AuthModule], controllers: [ExamController, MockTestController], providers: [ExamService] })
export class ExamModule {}
