import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class CreateUploadSessionDto {
  @IsString()
  @Min(1)
  @Max(255)
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
  @Min(1)
  @Max(64)
  purpose!: string;
}
