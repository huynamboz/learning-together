import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Symmetric encryption for provider API keys at rest.
 *
 * Keys are operator-supplied credentials for third-party services, so they are stored encrypted
 * and never returned by any endpoint. The encryption key itself comes from the environment —
 * putting it in the database would defeat the point.
 */

const VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;

export class MissingEncryptionKeyError extends Error {
  constructor() {
    super('AI_ENCRYPTION_KEY chưa được cấu hình nên không thể lưu hoặc đọc khoá provider.');
    this.name = 'MissingEncryptionKeyError';
  }
}

/** Accepts a 64-character hex or a 32-byte base64 value, so either style of secret works. */
export function readEncryptionKey(raw: string | undefined): Buffer {
  if (!raw?.trim()) throw new MissingEncryptionKeyError();
  const value = raw.trim();
  const candidate = /^[0-9a-fA-F]{64}$/.test(value) ? Buffer.from(value, 'hex') : Buffer.from(value, 'base64');
  if (candidate.length !== KEY_BYTES) {
    throw new Error(`AI_ENCRYPTION_KEY phải là 32 byte (64 ký tự hex hoặc base64 tương đương), đang là ${candidate.length} byte.`);
  }
  return candidate;
}

export function encryptSecret(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [VERSION, iv.toString('base64'), cipher.getAuthTag().toString('base64'), ciphertext.toString('base64')].join('.');
}

export function decryptSecret(payload: string, key: Buffer): string {
  const [version, iv, tag, ciphertext] = payload.split('.');
  if (version !== VERSION || !iv || !tag || !ciphertext) throw new Error('Chuỗi mã hoá không đúng định dạng.');
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
}

/** What the console is allowed to see: enough to tell two keys apart, not enough to use one. */
export function keyFingerprint(plaintext: string): string {
  const trimmed = plaintext.trim();
  return trimmed.length <= 4 ? '••••' : `••••${trimmed.slice(-4)}`;
}

/**
 * Scrubs anything key-shaped out of text bound for logs, error fields or the console. Provider
 * errors sometimes echo the request, and a stored error message is read by people.
 */
export function redactSecrets(text: string, secrets: string[] = []): string {
  let output = text;
  for (const secret of secrets) {
    if (secret && secret.length >= 6) output = output.split(secret).join('[redacted]');
  }
  return output
    .replace(/\b(sk|rk|pk)-[A-Za-z0-9_-]{8,}/g, '[redacted]')
    .replace(/\bBearer\s+[A-Za-z0-9._-]{8,}/gi, 'Bearer [redacted]');
}

/** Constant-time compare, used where a probe result is checked against an expected value. */
export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
