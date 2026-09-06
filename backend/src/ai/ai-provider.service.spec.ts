import { randomBytes } from 'node:crypto';
import { AiProviderService } from './ai-provider.service';
import { decryptSecret } from './secret-box';

const key = randomBytes(32);
const config = { get: () => key.toString('hex') } as never;
const noKeyConfig = { get: () => undefined } as never;

function txDouble() {
  return {
    aiProvider: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'p1', ...data })),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'p1', ...data })),
      delete: jest.fn()
    },
    auditLog: { create: jest.fn() }
  };
}

describe('AiProviderService', () => {
  it('stores the key encrypted and keeps only a fingerprint for the console', async () => {
    const tx = txDouble();
    const prisma = {
      aiProvider: { findFirst: jest.fn().mockResolvedValue({ priority: 2 }) },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
    };
    await new AiProviderService(prisma as never, config).create('admin-1', {
      name: 'OpenAI', baseUrl: 'https://api.openai.com/v1/', model: 'gpt-4o-mini', apiKey: 'sk-live-abcdef123456'
    });

    const written = tx.aiProvider.create.mock.calls[0][0].data as Record<string, string>;
    expect(written.apiKeyCipher).not.toContain('sk-live');
    expect(decryptSecret(written.apiKeyCipher, key)).toBe('sk-live-abcdef123456');
    expect(written.apiKeyLast4).toBe('••••3456');
    // A trailing slash would produce `…/v1//chat/completions` on the wire.
    expect(written.baseUrl).toBe('https://api.openai.com/v1');
    // New providers go to the end of the chain rather than displacing a working one.
    expect(written.priority).toBe(3);
  });

  it('never writes the key into the audit trail', async () => {
    const tx = txDouble();
    const prisma = {
      aiProvider: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
    };
    await new AiProviderService(prisma as never, config).create('admin-1', {
      name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', apiKey: 'sk-live-abcdef123456'
    });
    expect(JSON.stringify(tx.auditLog.create.mock.calls)).not.toContain('sk-live');
  });

  it('leaves the stored key alone when an edit does not include one', async () => {
    const tx = txDouble();
    const prisma = {
      aiProvider: { findUnique: jest.fn().mockResolvedValue({ id: 'p1' }) },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
    };
    await new AiProviderService(prisma as never, config).update('p1', 'admin-1', { name: 'Renamed' });
    const written = tx.aiProvider.update.mock.calls[0][0].data as Record<string, unknown>;
    expect(written).not.toHaveProperty('apiKeyCipher');
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'AI_PROVIDER_UPDATED' }) }));
  });

  it('records a key rotation separately from an ordinary edit', async () => {
    const tx = txDouble();
    const prisma = {
      aiProvider: { findUnique: jest.fn().mockResolvedValue({ id: 'p1' }) },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
    };
    await new AiProviderService(prisma as never, config).update('p1', 'admin-1', { apiKey: 'sk-new-abcdef999888' });
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'AI_PROVIDER_KEY_ROTATED' }) }));
    const written = tx.aiProvider.update.mock.calls[0][0].data as Record<string, string>;
    expect(decryptSecret(written.apiKeyCipher, key)).toBe('sk-new-abcdef999888');
  });

  it('refuses a reorder that does not name every provider exactly once', async () => {
    const prisma = { aiProvider: { findMany: jest.fn().mockResolvedValue([{ id: 'a' }, { id: 'b' }]) }, $transaction: jest.fn() };
    const service = new AiProviderService(prisma as never, config);
    await expect(service.reorder('admin-1', { providerIds: ['a'] })).rejects.toMatchObject({ code: 'PROVIDER_ORDER_MISMATCH' });
    await expect(service.reorder('admin-1', { providerIds: ['a', 'a'] })).rejects.toMatchObject({ code: 'DUPLICATE_PROVIDER_IN_ORDER' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('parks priorities out of range first so the unique constraint never clashes', async () => {
    const tx = txDouble();
    const prisma = {
      aiProvider: { findMany: jest.fn().mockResolvedValue([{ id: 'a' }, { id: 'b' }]) },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
    };
    await new AiProviderService(prisma as never, config).reorder('admin-1', { providerIds: ['b', 'a'] });
    const priorities = tx.aiProvider.update.mock.calls.map((call) => (call[0].data as { priority: number }).priority);
    expect(priorities).toEqual([-1, -2, 1, 2]);
  });

  it('explains the missing server key instead of failing obscurely at write time', async () => {
    const prisma = { aiProvider: { findFirst: jest.fn().mockResolvedValue(null) }, $transaction: jest.fn() };
    const service = new AiProviderService(prisma as never, noKeyConfig);
    expect(service.encryptionReady()).toBe(false);
    await expect(service.create('admin-1', { name: 'X', baseUrl: 'https://x.example.com/v1', model: 'm', apiKey: 'sk-abcdefgh' }))
      .rejects.toMatchObject({ code: 'AI_ENCRYPTION_KEY_MISSING' });
  });
});
