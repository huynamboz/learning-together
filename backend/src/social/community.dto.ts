import { IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, IsUUID } from 'class-validator';

export class CreatePostDto {
  @IsIn(['question', 'roadmap', 'resource', 'experience', 'listening', 'reading', 'speaking', 'writing', 'other'])
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
