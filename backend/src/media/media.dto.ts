import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateUploadSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  originalName!: string;

  @IsString()
  @Matches(/^[\w.+-]+\/[\w.+-]+$/)
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(524288000)
  byteSize!: number;

  @IsOptional()
  @IsString()
  checksum?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  purpose!: string;
}
