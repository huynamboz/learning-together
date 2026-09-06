import { Type } from 'class-transformer';
import { IsNumber, IsObject, Max, Min } from 'class-validator';

export class GradeWritingSubmissionDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  overall!: number;

  @IsObject()
  rubric!: Record<string, unknown>;

  @IsObject()
  feedback!: Record<string, unknown>;
}
