import { AttemptContext } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

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
