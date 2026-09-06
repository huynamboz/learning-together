/**
 * What to do when a provider call fails.
 *
 * Three outcomes, because they are genuinely different situations:
 *
 * - `retry`    the provider is momentarily unavailable — rate limited, overloaded, a dropped
 *              socket. Worth trying the same provider again before giving up on it.
 * - `failover` the provider is misconfigured or refusing us — a bad key, a model it does not
 *              serve, a dead host. Another provider may well succeed, so move on.
 * - `fatal`    our own request is malformed. Every provider will reject it the same way, so
 *              trying two more is wasted money and wasted time. Fail immediately.
 */
export type FailureAction = 'retry' | 'failover' | 'fatal';

export function classifyHttpFailure(status: number): FailureAction {
  if (status === 408 || status === 409 || status === 425 || status === 429) return 'retry';
  if (status >= 500) return 'retry';
  // 401/403 are an auth problem with this provider; 404 usually means the model or path is wrong.
  if (status === 401 || status === 403 || status === 404) return 'failover';
  // 400 and 422 mean the payload itself is wrong — the next provider would reject it too.
  if (status === 400 || status === 422) return 'fatal';
  if (status >= 400) return 'failover';
  return 'failover';
}

/** Network-level problems never reached the provider, so they are always worth another go. */
export function classifyTransportFailure(): FailureAction {
  return 'retry';
}

export type ProviderCandidate = {
  id: string;
  enabled: boolean;
  priority: number;
};

/** Enabled providers in the order they should be tried; ties break by id so runs are repeatable. */
export function selectionOrder<T extends ProviderCandidate>(providers: T[]): T[] {
  return providers
    .filter((provider) => provider.enabled)
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

/** Exponential backoff with a ceiling, so a retry storm cannot stall a request indefinitely. */
export function backoffMs(attempt: number, baseMs = 250, capMs = 4000): number {
  return Math.min(baseMs * 2 ** Math.max(0, attempt), capMs);
}
