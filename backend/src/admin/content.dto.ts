import { ContentType } from '@prisma/client';
import { IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateContentDto {
  @IsEnum(ContentType)
  type!: ContentType;

  @IsString()
  title!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  part?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  level?: number;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class AttachContentMediaDto {
  @IsUUID()
  assetId!: string;
}
