export type AiProviderHealth = 'UNKNOWN' | 'HEALTHY' | 'FAILING';

export type AiProvider = {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKeyLast4: string;
  enabled: boolean;
  priority: number;
  timeoutMs: number;
  maxRetries: number;
  health: AiProviderHealth;
  lastCheckedAt: string | null;
  lastLatencyMs: number | null;
  lastError: string | null;
};

export type AiProbeAttempt = {
  providerId: string;
  providerName: string;
  model: string;
  ok: boolean;
  status?: number;
  action?: 'retry' | 'failover' | 'fatal';
  latencyMs: number;
  error?: string;
};

export const healthLabels: Record<AiProviderHealth, string> = {
  HEALTHY: 'Đang hoạt động',
  FAILING: 'Đang lỗi',
  UNKNOWN: 'Chưa kiểm tra'
};

/** Colour carries the same information as the label, so the state reads at a glance. */
export const healthTones: Record<AiProviderHealth, string> = {
  HEALTHY: 'bg-leaf/15 text-[#28896D]',
  FAILING: 'bg-blush text-[#C1472F]',
  UNKNOWN: 'bg-white text-ink/50'
};

/**
 * The row itself carries the state, not just the chip: a provider that failed its last call should
 * not read as calm green when an operator is scanning the chain for what to fix.
 */
export function providerTone(provider: Pick<AiProvider, 'enabled' | 'health'>): string {
  if (!provider.enabled) return 'bg-field';
  return provider.health === 'FAILING' ? 'bg-blush' : 'bg-mint';
}

/**
 * Which provider actually answers a request: the first one that is switched on. Everything below
 * it is a spare, and everything switched off is not in the chain at all.
 */
export function activeProvider(providers: readonly AiProvider[]): AiProvider | null {
  return providers.find((provider) => provider.enabled) ?? null;
}

export function fallbackCount(providers: readonly AiProvider[]): number {
  return Math.max(0, providers.filter((provider) => provider.enabled).length - 1);
}

/** What an operator should fix next, in the order the chain would hit the problem. */
export function chainWarning(providers: readonly AiProvider[], encryptionReady: boolean): string | null {
  if (!encryptionReady) return 'Server chưa có AI_ENCRYPTION_KEY nên chưa lưu được khoá provider nào.';
  if (!providers.length) return 'Chưa có provider nào. Thêm ít nhất một để các tính năng AI dùng được.';
  const enabled = providers.filter((provider) => provider.enabled);
  if (!enabled.length) return 'Tất cả provider đang tắt, mọi yêu cầu AI sẽ trả lỗi ngay.';
  if (enabled.length === 1) return 'Chỉ có một provider đang bật — provider này lỗi là không còn gì để dự phòng.';
  if (enabled.every((provider) => provider.health === 'FAILING')) return 'Cả chuỗi dự phòng đang lỗi ở lần gọi gần nhất.';
  return null;
}

export function formatLatency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(1)}s`;
}

/** Base URLs are pasted from provider docs, where the `/chat/completions` suffix is often included. */
export function normaliseBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '').replace(/\/chat\/completions$/i, '');
}
