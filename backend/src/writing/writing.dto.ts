import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class SubmitWritingDto {
  @IsInt()
  @Min(1)
  @Max(3)
  part!: number;

  @IsOptional()
  @IsUUID()
  promptId?: string;

  @IsString()
  body!: string;
}
