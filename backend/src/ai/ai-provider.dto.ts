import { IsBoolean, IsInt, IsObject, IsOptional, IsString, IsUrl, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateAiProviderDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  /** OpenAI-compatible base such as https://api.openai.com/v1 — the path is appended by the gateway. */
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  @Length(8, 500)
  baseUrl!: string;

  @IsString()
  @Length(1, 180)
  model!: string;

  @IsString()
  @Length(8, 400)
  apiKey!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(120000)
  timeoutMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  maxRetries?: number;

  @IsOptional()
  @IsObject()
  extraHeaders?: Record<string, string>;
}

export class UpdateAiProviderDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  @Length(8, 500)
  baseUrl?: string;

  @IsOptional()
  @IsString()
  @Length(1, 180)
  model?: string;

  /** Only sent when the operator is replacing the key; omitted leaves the stored one untouched. */
  @IsOptional()
  @IsString()
  @Length(8, 400)
  apiKey?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(120000)
  timeoutMs?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  maxRetries?: number;

  @IsOptional()
  @IsObject()
  extraHeaders?: Record<string, string>;
}

export class ReorderAiProvidersDto {
  @IsUUID('4', { each: true })
  providerIds!: string[];
}
