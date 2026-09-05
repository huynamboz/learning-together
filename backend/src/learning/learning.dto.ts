import { AttemptContext } from '@prisma/client';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class RecordAttemptDto {
  @IsUUID()
  questionId!: string;

  @IsEnum(AttemptContext)
  context!: AttemptContext;

  @IsOptional()
  @IsUUID()
  contextId?: string;

  @IsOptional()
  @IsString()
  selectedAnswer?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600000)
  timeMs?: number;
}

export class RecordStudySessionDto {
  @IsIn(['listening', 'reading', 'video', 'vocabulary', 'mock-test', 'writing'])
  surface!: string;

  @IsInt()
  @Min(1)
  @Max(86400)
  durationSeconds!: number;
}
