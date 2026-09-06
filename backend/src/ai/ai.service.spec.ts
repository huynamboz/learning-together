import { randomBytes } from 'node:crypto';
import { AiService } from './ai.service';
import { encryptSecret } from './secret-box';

const key = randomBytes(32);
const config = { get: () => key.toString('hex') } as never;

type ProviderSeed = { id: string; name: string; priority: number; enabled?: boolean; maxRetries?: number };

function providers(...seeds: ProviderSeed[]) {
  return seeds.map((seed) => ({
    id: seed.id,
    name: seed.name,
    baseUrl: `https://${seed.id}.example.com/v1`,
    model: 'test-model',
    apiKeyCipher: encryptSecret(`sk-${seed.id}-abcdef123456`, key),
    enabled: seed.enabled ?? true,
    priority: seed.priority,
    timeoutMs: 5000,
    maxRetries: seed.maxRetries ?? 0,
    extraHeaders: null
  }));
}

function prismaWith(rows: ReturnType<typeof providers>) {
  return {
    aiProvider: {
      findMany: jest.fn().mockResolvedValue(rows),
      findUnique: jest.fn().mockResolvedValue(rows[0] ?? null),
      update: jest.fn().mockResolvedValue({})
    }
  };
}

const ok = (text: string) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: text } }], usage: { prompt_tokens: 5, completion_tokens: 2 } }) });
const fail = (status: number, body = 'upstream said no') => ({ ok: false, status, text: async () => body });

function mockFetch(...responses: unknown[]) {
  const calls: string[] = [];
  const fetchMock = jest.fn(async (url: string, ...rest: unknown[]) => {
    void rest;
    calls.push(url);
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return next;
  });
  global.fetch = fetchMock as never;
  return { calls, fetchMock };
}

const request = { purpose: 'test', messages: [{ role: 'user' as const, content: 'hi' }] };

describe('AiService fallback', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses the highest-priority provider when it answers', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1 }, { id: 'two', name: 'Two', priority: 2 }));
    const { calls } = mockFetch(ok('hello'));
    const result = await new AiService(prisma as never, config).complete(request);
    expect(result.text).toBe('hello');
    expect(result.provider.name).toBe('One');
    expect(calls).toEqual(['https://one.example.com/v1/chat/completions']);
  });

  it('moves to the next provider when the first one is down, and reports both attempts', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1 }, { id: 'two', name: 'Two', priority: 2 }));
    const { calls } = mockFetch(fail(500), ok('rescued'));
    const result = await new AiService(prisma as never, config).complete(request);
    expect(result.text).toBe('rescued');
    expect(result.provider.name).toBe('Two');
    expect(calls).toHaveLength(2);
    expect(result.attempts.map((attempt) => attempt.ok)).toEqual([false, true]);
  });

  it('retries the same provider before failing over when the failure is transient', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1, maxRetries: 1 }, { id: 'two', name: 'Two', priority: 2 }));
    const { calls } = mockFetch(fail(429), ok('second try'));
    const result = await new AiService(prisma as never, config).complete(request);
    expect(result.text).toBe('second try');
    expect(calls).toEqual(['https://one.example.com/v1/chat/completions', 'https://one.example.com/v1/chat/completions']);
  });

  it('does not waste a retry on a bad key — it goes straight to the next provider', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1, maxRetries: 3 }, { id: 'two', name: 'Two', priority: 2 }));
    const { calls } = mockFetch(fail(401), ok('other provider'));
    await new AiService(prisma as never, config).complete(request);
    expect(calls).toEqual(['https://one.example.com/v1/chat/completions', 'https://two.example.com/v1/chat/completions']);
  });

  it('stops immediately when our own request is malformed, without spending the spares', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1 }, { id: 'two', name: 'Two', priority: 2 }));
    const { calls } = mockFetch(fail(400, 'messages[0].content is required'));
    await expect(new AiService(prisma as never, config).complete(request)).rejects.toMatchObject({ code: 'AI_REQUEST_REJECTED' });
    expect(calls).toHaveLength(1);
  });

  it('reports every attempt when the whole chain is down', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1 }, { id: 'two', name: 'Two', priority: 2 }));
    mockFetch(fail(503), fail(503));
    await expect(new AiService(prisma as never, config).complete(request)).rejects.toMatchObject({
      code: 'AI_ALL_PROVIDERS_FAILED',
      details: { attempts: expect.arrayContaining([expect.objectContaining({ providerName: 'One' }), expect.objectContaining({ providerName: 'Two' })]) }
    });
  });

  it('treats a network error as a failure of that provider, not of the request', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1 }, { id: 'two', name: 'Two', priority: 2 }));
    mockFetch(new Error('connect ECONNREFUSED'), ok('second provider answered'));
    await expect(new AiService(prisma as never, config).complete(request)).resolves.toMatchObject({ text: 'second provider answered' });
  });

  it('treats an empty answer as a failure worth failing over', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1 }, { id: 'two', name: 'Two', priority: 2 }));
    mockFetch(ok('   '), ok('real answer'));
    await expect(new AiService(prisma as never, config).complete(request)).resolves.toMatchObject({ text: 'real answer' });
  });

  it('says so plainly when nothing is configured, instead of pretending to try', async () => {
    const prisma = prismaWith([]);
    const { fetchMock } = mockFetch();
    await expect(new AiService(prisma as never, config).complete(request)).rejects.toMatchObject({ code: 'AI_NO_PROVIDER' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips a disabled provider entirely', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1, enabled: false }, { id: 'two', name: 'Two', priority: 2 }));
    const { calls } = mockFetch(ok('from the enabled one'));
    await new AiService(prisma as never, config).complete(request);
    expect(calls).toEqual(['https://two.example.com/v1/chat/completions']);
  });

  it('sends the operator key as a bearer token and never in the body', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1 }));
    const { fetchMock } = mockFetch(ok('hi'));
    await new AiService(prisma as never, config).complete(request);
    const init = fetchMock.mock.calls[0][1] as unknown as { headers: Record<string, string>; body: string };
    expect(init.headers.authorization).toBe('Bearer sk-one-abcdef123456');
    expect(init.body).not.toContain('sk-one');
  });

  it('keeps a provider key out of the stored error text', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1 }));
    mockFetch(fail(503, 'rejected token sk-one-abcdef123456'));
    const service = new AiService(prisma as never, config);
    await expect(service.complete(request)).rejects.toMatchObject({ code: 'AI_ALL_PROVIDERS_FAILED' });
    expect(prisma.aiProvider.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ lastError: expect.not.stringContaining('sk-one-abcdef123456') })
    }));
  });

  it('records health so the console can show which provider is failing', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1 }, { id: 'two', name: 'Two', priority: 2 }));
    mockFetch(fail(500), ok('ok'));
    await new AiService(prisma as never, config).complete(request);
    expect(prisma.aiProvider.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'one' }, data: expect.objectContaining({ health: 'FAILING' }) }));
    expect(prisma.aiProvider.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'two' }, data: expect.objectContaining({ health: 'HEALTHY' }) }));
  });
});

describe('probe', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the outcome of one small call rather than throwing', async () => {
    const prisma = prismaWith(providers({ id: 'one', name: 'One', priority: 1 }));
    mockFetch(fail(401, 'invalid api key'));
    const attempt = await new AiService(prisma as never, config).probe('one');
    expect(attempt).toMatchObject({ ok: false, status: 401, action: 'failover' });
  });

  it('reports a missing provider instead of probing nothing', async () => {
    const prisma = { aiProvider: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() } };
    await expect(new AiService(prisma as never, config).probe('missing')).rejects.toMatchObject({ code: 'AI_PROVIDER_NOT_FOUND' });
  });
});
