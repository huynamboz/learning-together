import { describe, expect, it } from 'vitest';
import { activeProvider, chainWarning, fallbackCount, formatLatency, normaliseBaseUrl, providerTone, type AiProvider } from '../utils/ai';

const provider = (partial: Partial<AiProvider> = {}): AiProvider => ({
  id: 'p1', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', apiKeyLast4: '••••3456',
  enabled: true, priority: 1, timeoutMs: 30000, maxRetries: 1, health: 'UNKNOWN',
  lastCheckedAt: null, lastLatencyMs: null, lastError: null, ...partial
});

describe('the fallback chain as an operator reads it', () => {
  it('names the first switched-on provider as the one that answers', () => {
    const chain = [provider({ id: 'a', enabled: false }), provider({ id: 'b' }), provider({ id: 'c' })];
    expect(activeProvider(chain)?.id).toBe('b');
    expect(fallbackCount(chain)).toBe(1);
  });

  it('reports no active provider when everything is switched off', () => {
    expect(activeProvider([provider({ enabled: false })])).toBeNull();
    expect(fallbackCount([provider({ enabled: false })])).toBe(0);
  });
});

describe('chain warnings', () => {
  it('leads with the server key, because nothing else can be fixed first', () => {
    expect(chainWarning([provider()], false)).toMatch(/AI_ENCRYPTION_KEY/);
  });

  it('warns when a single provider leaves nothing to fall back to', () => {
    expect(chainWarning([provider()], true)).toMatch(/dự phòng/);
  });

  it('warns when every provider is switched off', () => {
    expect(chainWarning([provider({ enabled: false }), provider({ id: 'p2', enabled: false })], true)).toMatch(/đang tắt/);
  });

  it('warns when the whole chain failed its last call', () => {
    expect(chainWarning([provider({ health: 'FAILING' }), provider({ id: 'p2', health: 'FAILING' })], true)).toMatch(/Cả chuỗi/);
  });

  it('stays quiet when a healthy provider has a spare behind it', () => {
    expect(chainWarning([provider({ health: 'HEALTHY' }), provider({ id: 'p2' })], true)).toBeNull();
  });
});

describe('row tone', () => {
  it('does not paint a failing provider the same calm green as a working one', () => {
    expect(providerTone(provider({ health: 'FAILING' }))).not.toBe(providerTone(provider({ health: 'HEALTHY' })));
  });

  it('mutes a switched-off provider, whatever its last result was', () => {
    expect(providerTone(provider({ enabled: false, health: 'HEALTHY' }))).toBe(providerTone(provider({ enabled: false, health: 'FAILING' })));
  });
});

describe('display helpers', () => {
  it('reads latency in the unit that suits the number', () => {
    expect(formatLatency(840)).toBe('840ms');
    expect(formatLatency(2400)).toBe('2.4s');
    expect(formatLatency(null)).toBe('—');
  });

  it('accepts a base URL pasted straight from provider docs', () => {
    expect(normaliseBaseUrl('https://api.openai.com/v1/chat/completions')).toBe('https://api.openai.com/v1');
    expect(normaliseBaseUrl('  https://api.groq.com/openai/v1/  ')).toBe('https://api.groq.com/openai/v1');
  });
});
