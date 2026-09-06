import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { ContentAdminController } from './content.controller';
import { ContentAdminService } from './content.service';
import { ExamBuilderController } from './exam-builder.controller';
import { ExamBuilderService } from './exam-builder.service';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { MediaAdminController } from './media.controller';
import { MediaAdminService } from './media.service';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { WritingReviewController } from './writing-review.controller';
import { WritingReviewService } from './writing-review.service';

@Module({ imports: [AuthModule], controllers: [ContentAdminController, ExamBuilderController, ImportController, OperationsController, MediaAdminController, WritingReviewController], providers: [ContentAdminService, ExamBuilderService, ImportService, OperationsService, MediaAdminService, WritingReviewService] })
export class AdminModule {}
