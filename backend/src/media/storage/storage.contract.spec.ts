import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { text } from 'node:stream/consumers';
import { LocalStorage } from './local.storage';

describe('ObjectStorage contract: local provider', () => {
  let root: string;

  beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'toeic-storage-')); });
  afterEach(async () => { await rm(root, { recursive: true, force: true }); });

  it('stores, heads, completes and deletes an object', async () => {
    const source = join(root, 'source.txt');
    await writeFile(source, 'hello toeic');
    const storage = new LocalStorage(join(root, 'objects'));
    const key = 'development/media/document/test.txt';
    await storage.createUpload({ bucket: 'toeic-web', key, mimeType: 'text/plain', byteSize: 11, expiresInSeconds: 300 });
    const result = await storage.putFile({ bucket: 'toeic-web', key, filePath: source, mimeType: 'text/plain', byteSize: 11 });
    expect(result.size).toBe(11);
    expect((await storage.headObject({ bucket: 'toeic-web', key }))?.size).toBe(11);
    const readable = await storage.getObject({ bucket: 'toeic-web', key });
    expect(await text(readable!.stream)).toBe('hello toeic');
    await storage.completeUpload({ bucket: 'toeic-web', key, expectedSize: 11 });
    await storage.deleteObject({ bucket: 'toeic-web', key });
    expect(await storage.headObject({ bucket: 'toeic-web', key })).toBeNull();
  });

  it('rejects traversal keys', async () => {
    const storage = new LocalStorage(root);
    await expect(storage.headObject({ bucket: 'toeic-web', key: '../escape.txt' })).rejects.toMatchObject({ code: 'INVALID_OBJECT_KEY' });
  });
});
