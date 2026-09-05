import { S3CompatibleStorage } from './s3-compatible.storage';

describe.each([
  { name: 's3' as const, endpoint: undefined },
  { name: 'r2' as const, endpoint: 'https://account.r2.cloudflarestorage.com' }
])('S3-compatible storage adapter ($name)', ({ name, endpoint }) => {
  it('creates a direct signed upload without exposing credentials', async () => {
    const storage = new S3CompatibleStorage({ name, endpoint, region: 'auto', accessKeyId: 'access-key', secretAccessKey: 'secret-key' });
    const result = await storage.createUpload({ bucket: 'toeic-web', key: 'development/media/test.txt', mimeType: 'text/plain', byteSize: 10, expiresInSeconds: 300 });
    expect(result.mode).toBe('direct');
    expect(result.provider).toBe(name);
    expect(result.url).toContain('X-Amz-Signature');
    expect(result.url).not.toContain('secret-key');
  });

  it('rejects completion when the remote object is missing', async () => {
    const storage = new S3CompatibleStorage({ name, endpoint, region: 'auto', accessKeyId: 'access-key', secretAccessKey: 'secret-key' });
    jest.spyOn((storage as unknown as { client: { send: jest.Mock } }).client, 'send').mockRejectedValue({ $metadata: { httpStatusCode: 404 } });
    await expect(storage.completeUpload({ bucket: 'toeic-web', key: 'missing.txt', expectedSize: 1 })).rejects.toMatchObject({ code: 'OBJECT_NOT_FOUND' });
  });
});
