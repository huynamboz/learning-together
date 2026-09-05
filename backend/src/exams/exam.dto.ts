import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class StartExamDto {
  @IsUUID()
  testId!: string;

  @IsIn(['practice', 'exam'])
  mode!: 'practice' | 'exam';
}

export class SaveExamAnswerDto {
  @IsUUID()
  questionId!: string;

  @IsOptional()
  @IsString()
  selectedAnswer?: string;
}
