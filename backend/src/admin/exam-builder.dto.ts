import { ExamSectionKind, QuestionGroupType, QuestionKind } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Length, Max, Min, ValidateNested } from 'class-validator';

export class CreateMockTestDto {
  @IsString()
  @Length(3, 255)
  title!: string;

  @IsString()
  @Length(3, 255)
  slug!: string;

  @IsInt()
  @Min(1)
  @Max(600)
  durationMin!: number;
}

export class CreateSectionDto {
  @IsEnum(ExamSectionKind)
  kind!: ExamSectionKind;

  @IsString()
  @Length(1, 120)
  label!: string;

  @IsInt()
  @Min(1)
  @Max(300)
  durationMin!: number;
}

export class CreateGroupDto {
  @IsUUID()
  sectionId!: string;

  @IsEnum(QuestionGroupType)
  type!: QuestionGroupType;

  @IsInt()
  @Min(1)
  @Max(7)
  part!: number;

  /** Directions, photo captions and passages. Free-form so a form can carry its own shape. */
  @IsOptional()
  @IsObject()
  stimulus?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @Length(0, 10000)
  transcript?: string;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsObject()
  stimulus?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @Length(0, 10000)
  transcript?: string;

  @IsOptional()
  @IsUUID()
  audioAssetId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  audioStartSec?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  audioEndSec?: number | null;
}

export class AttachGroupMediaDto {
  @IsUUID()
  assetId!: string;

  /** `photo` for a Part 1 picture, `graphic` for a Part 3/4 chart. */
  @IsOptional()
  @IsString()
  @Length(1, 32)
  role?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  caption?: string;
}

class QuestionOptionDto {
  @IsString()
  @Length(1, 8)
  key!: string;

  @IsString()
  @Length(1, 2000)
  text!: string;
}

export class CreateGroupQuestionDto {
  @IsEnum(QuestionKind)
  kind!: QuestionKind;

  @IsString()
  @Length(1, 4000)
  prompt!: string;

  @IsString()
  @Length(1, 8)
  answerKey!: string;

  @IsOptional()
  @IsString()
  @Length(0, 4000)
  explanation?: string;

  /** The item number as printed in the source paper, so an answer key matches by number. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(400)
  numberInTest?: number;

  @IsOptional()
  @IsBoolean()
  optionsHidden?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  level?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options!: QuestionOptionDto[];
}

class ScoreConversionRowDto {
  @IsEnum(ExamSectionKind)
  section!: ExamSectionKind;

  @IsInt()
  @Min(0)
  @Max(400)
  rawCorrect!: number;

  @IsInt()
  @Min(0)
  @Max(990)
  scaled!: number;
}

export class ReplaceConversionsDto {
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => ScoreConversionRowDto)
  rows!: ScoreConversionRowDto[];
}
