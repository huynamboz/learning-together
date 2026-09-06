import { randomBytes } from 'node:crypto';
import { decryptSecret, encryptSecret, keyFingerprint, MissingEncryptionKeyError, readEncryptionKey, redactSecrets, safeEqual } from './secret-box';

const key = randomBytes(32);

describe('encryption key parsing', () => {
  it('accepts either a hex or a base64 spelling of the same key', () => {
    expect(readEncryptionKey(key.toString('hex'))).toEqual(key);
    expect(readEncryptionKey(key.toString('base64'))).toEqual(key);
  });

  it('refuses a key that is not 32 bytes, rather than silently padding it', () => {
    expect(() => readEncryptionKey(randomBytes(16).toString('hex'))).toThrow(/32 byte/);
  });

  it('names the missing configuration when nothing is set', () => {
    expect(() => readEncryptionKey(undefined)).toThrow(MissingEncryptionKeyError);
    expect(() => readEncryptionKey('   ')).toThrow(MissingEncryptionKeyError);
  });
});

describe('secret storage', () => {
  it('round-trips a provider key', () => {
    const stored = encryptSecret('sk-live-abcdef123456', key);
    expect(stored).not.toContain('sk-live');
    expect(decryptSecret(stored, key)).toBe('sk-live-abcdef123456');
  });

  it('produces a different ciphertext each time so equal keys are not detectable', () => {
    expect(encryptSecret('same-key-value', key)).not.toBe(encryptSecret('same-key-value', key));
  });

  it('refuses a tampered payload instead of returning damaged plaintext', () => {
    const stored = encryptSecret('sk-live-abcdef123456', key);
    const [version, iv, tag, ciphertext] = stored.split('.');
    const flipped = Buffer.from(ciphertext, 'base64');
    flipped[0] ^= 0xff;
    expect(() => decryptSecret([version, iv, tag, flipped.toString('base64')].join('.'), key)).toThrow();
  });

  it('cannot be read with a different key', () => {
    const stored = encryptSecret('sk-live-abcdef123456', key);
    expect(() => decryptSecret(stored, randomBytes(32))).toThrow();
  });

  it('rejects a payload that is not in the expected format', () => {
    expect(() => decryptSecret('not-encrypted', key)).toThrow(/định dạng/);
  });
});

describe('what the console is allowed to see', () => {
  it('shows the last four characters only', () => {
    expect(keyFingerprint('sk-live-abcdef123456')).toBe('••••3456');
    expect(keyFingerprint('abc')).toBe('••••');
  });
});

describe('redaction', () => {
  it('strips a known key out of a provider error message', () => {
    expect(redactSecrets('bad token my-secret-value in header', ['my-secret-value'])).toBe('bad token [redacted] in header');
  });

  it('strips key-shaped text even when the value is not known', () => {
    expect(redactSecrets('Authorization: Bearer sk-proj-AAAABBBBCCCC failed')).not.toContain('AAAABBBB');
  });

  it('leaves ordinary error text alone', () => {
    expect(redactSecrets('model gpt-4o-mini is overloaded')).toBe('model gpt-4o-mini is overloaded');
  });
});

describe('constant-time compare', () => {
  it('matches equal values and rejects different lengths without throwing', () => {
    expect(safeEqual('ok', 'ok')).toBe(true);
    expect(safeEqual('ok', 'okay')).toBe(false);
  });
});
