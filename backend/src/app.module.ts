import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './access/roles.guard';
import { MediaModule } from './media/media.module';
import { AdminModule } from './admin/admin.module';
import { LearningModule } from './learning/learning.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { ExamModule } from './exams/exam.module';
import { WritingModule } from './writing/writing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validationSchema: envValidationSchema }),
    LoggerModule.forRoot({ pinoHttp: { level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' } }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    MediaModule,
    AdminModule,
    LearningModule,
    VocabularyModule,
    ExamModule,
    WritingModule
  ],
  providers: [{ provide: APP_GUARD, useClass: RolesGuard }]
})
export class AppModule {}
