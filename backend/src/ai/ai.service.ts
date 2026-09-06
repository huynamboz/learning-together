import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiProviderHealth, Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { ApiError } from '@/common/http/api-error';
import { backoffMs, classifyHttpFailure, classifyTransportFailure, selectionOrder, type FailureAction } from './failure-policy';
import { decryptSecret, readEncryptionKey, redactSecrets } from './secret-box';

export type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface AiCompletionRequest {
  /** Why the call is being made, e.g. `writing-grading`. Recorded so cost can be attributed. */
  purpose: string;
  messages: AiMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Ask the provider for strict JSON where it supports the flag. */
  json?: boolean;
}

export interface AiAttempt {
  providerId: string;
  providerName: string;
  model: string;
  ok: boolean;
  status?: number;
  action?: FailureAction;
  latencyMs: number;
  error?: string;
}

export interface AiCompletionResult {
  text: string;
  provider: { id: string; name: string; model: string };
  usage?: { promptTokens?: number; completionTokens?: number };
  latencyMs: number;
  /** Every provider tried, in order, including the ones that failed. */
  attempts: AiAttempt[];
}

type LoadedProvider = {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKeyCipher: string;
  enabled: boolean;
  priority: number;
  timeoutMs: number;
  maxRetries: number;
  extraHeaders: Prisma.JsonValue | null;
};

/**
 * One gateway in front of every configured AI endpoint.
 *
 * Callers ask for a completion and say what it is for; they do not choose a provider, hold a key,
 * or implement their own retries. Providers are tried in priority order and a failure moves to the
 * next one, so adding a spare is a configuration change rather than a code change.
 *
 * The wire format is the OpenAI chat-completions shape, which is what almost every hosted gateway
 * and local runtime speaks. A provider that needs a different shape would need an adapter here.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private encryptionKey() {
    return readEncryptionKey(this.config.get<string>('ai.encryptionKey'));
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const providers = selectionOrder(await this.prisma.aiProvider.findMany({
      select: { id: true, name: true, baseUrl: true, model: true, apiKeyCipher: true, enabled: true, priority: true, timeoutMs: true, maxRetries: true, extraHeaders: true }
    }) as LoadedProvider[]);

    if (!providers.length) {
      throw new ApiError('AI_NO_PROVIDER', 'Chưa có AI provider nào được bật.', {}, 503);
    }

    const key = this.encryptionKey();
    const attempts: AiAttempt[] = [];

    for (const provider of providers) {
      const total = Math.max(0, provider.maxRetries) + 1;
      for (let attempt = 0; attempt < total; attempt += 1) {
        const outcome = await this.callProvider(provider, request, key);
        attempts.push(outcome.attempt);

        if (outcome.ok) {
          await this.recordHealth(provider.id, AiProviderHealth.HEALTHY, outcome.attempt.latencyMs, null);
          return { text: outcome.text, provider: { id: provider.id, name: provider.name, model: provider.model }, usage: outcome.usage, latencyMs: outcome.attempt.latencyMs, attempts };
        }

        await this.recordHealth(provider.id, AiProviderHealth.FAILING, outcome.attempt.latencyMs, outcome.attempt.error ?? null);

        if (outcome.attempt.action === 'fatal') {
          // Our own payload is wrong; the next provider would reject it identically.
          throw new ApiError('AI_REQUEST_REJECTED', 'Provider từ chối nội dung yêu cầu; các provider khác cũng sẽ từ chối như vậy.', { attempts }, 422);
        }
        if (outcome.attempt.action === 'failover') break;
        if (attempt < total - 1) await sleep(backoffMs(attempt));
      }
    }

    this.logger.warn(`AI completion failed for "${request.purpose}" after ${attempts.length} attempt(s)`);
    throw new ApiError('AI_ALL_PROVIDERS_FAILED', 'Tất cả AI provider đang cấu hình đều gọi không thành công.', { attempts }, 502);
  }

  /** Sends a deliberately tiny prompt so an operator can check one provider without spending much. */
  async probe(providerId: string): Promise<AiAttempt> {
    const provider = await this.prisma.aiProvider.findUnique({
      where: { id: providerId },
      select: { id: true, name: true, baseUrl: true, model: true, apiKeyCipher: true, enabled: true, priority: true, timeoutMs: true, maxRetries: true, extraHeaders: true }
    });
    if (!provider) throw new ApiError('AI_PROVIDER_NOT_FOUND', 'Không tìm thấy provider.', {}, 404);

    const outcome = await this.callProvider(provider as LoadedProvider, {
      purpose: 'provider-probe',
      messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
      maxTokens: 8,
      temperature: 0
    }, this.encryptionKey());

    await this.recordHealth(provider.id, outcome.ok ? AiProviderHealth.HEALTHY : AiProviderHealth.FAILING, outcome.attempt.latencyMs, outcome.attempt.error ?? null);
    return outcome.attempt;
  }

  private async callProvider(provider: LoadedProvider, request: AiCompletionRequest, key: Buffer) {
    const startedAt = Date.now();
    const base: AiAttempt = { providerId: provider.id, providerName: provider.name, model: provider.model, ok: false, latencyMs: 0 };
    let apiKey = '';

    try {
      apiKey = decryptSecret(provider.apiKeyCipher, key);
    } catch {
      return { ok: false as const, attempt: { ...base, action: 'failover' as const, latencyMs: Date.now() - startedAt, error: 'Không giải mã được khoá của provider này.' } };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(1000, provider.timeoutMs));

    try {
      const response = await fetch(`${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
          ...toHeaderRecord(provider.extraHeaders)
        },
        body: JSON.stringify({
          model: provider.model,
          messages: request.messages,
          ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
          ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
          ...(request.json ? { response_format: { type: 'json_object' } } : {})
        })
      });

      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        const body = redactSecrets(await response.text().catch(() => ''), [apiKey]).slice(0, 400);
        return { ok: false as const, attempt: { ...base, status: response.status, action: classifyHttpFailure(response.status), latencyMs, error: body || `HTTP ${response.status}` } };
      }

      const payload = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const text = payload.choices?.[0]?.message?.content;
      if (typeof text !== 'string' || !text.trim()) {
        return { ok: false as const, attempt: { ...base, status: response.status, action: 'failover' as const, latencyMs, error: 'Provider trả về nội dung rỗng.' } };
      }

      return {
        ok: true as const,
        text,
        usage: { promptTokens: payload.usage?.prompt_tokens, completionTokens: payload.usage?.completion_tokens },
        attempt: { ...base, ok: true, status: response.status, latencyMs }
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const aborted = error instanceof Error && error.name === 'AbortError';
      const message = aborted ? `Quá ${provider.timeoutMs}ms không có phản hồi.` : redactSecrets(error instanceof Error ? error.message : 'Lỗi mạng.', [apiKey]);
      return { ok: false as const, attempt: { ...base, action: classifyTransportFailure(), latencyMs, error: message.slice(0, 400) } };
    } finally {
      clearTimeout(timer);
    }
  }

  private recordHealth(id: string, health: AiProviderHealth, latencyMs: number, error: string | null) {
    return this.prisma.aiProvider.update({
      where: { id },
      data: { health, lastCheckedAt: new Date(), lastLatencyMs: latencyMs, lastError: error?.slice(0, 500) ?? null }
    }).catch(() => undefined);
  }
}

function toHeaderRecord(value: Prisma.JsonValue | null): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
