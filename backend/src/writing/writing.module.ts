import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { WritingController } from './writing.controller';
import { WritingService } from './writing.service';

@Module({ imports: [AuthModule], controllers: [WritingController], providers: [WritingService] })
export class WritingModule {}
