import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { copyFile, mkdir, readFile, rename, stat, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ApiError } from '@/common/http/api-error';
import type { CompleteUploadInput, CreateUploadInput, ObjectMetadata, ObjectRef, ObjectStorage, ReadableObject, ServerFileInput, StoredObject, UploadInstructions } from './storage.types';

@Injectable()
export class LocalStorage implements ObjectStorage {
  readonly name = 'local' as const;

  constructor(private readonly root: string) {}

  async createUpload(input: CreateUploadInput): Promise<UploadInstructions> {
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    await mkdir(dirname(this.filePath(input.key)), { recursive: true });
    return { mode: 'server', provider: this.name, method: 'POST', expiresAt };
  }

  async completeUpload(input: CompleteUploadInput): Promise<StoredObject> {
    const metadata = await this.headObject(input);
    if (!metadata) throw new ApiError('OBJECT_NOT_FOUND', 'Tệp chưa được upload.', {}, 409);
    if (metadata.size !== input.expectedSize) throw new ApiError('OBJECT_SIZE_MISMATCH', 'Kích thước tệp không khớp.', { expected: input.expectedSize, actual: metadata.size }, 422);
    if (input.expectedChecksum && metadata.checksum !== input.expectedChecksum) throw new ApiError('OBJECT_CHECKSUM_MISMATCH', 'Checksum tệp không khớp.', {}, 422);
    return { ...input, provider: this.name, size: metadata.size, checksum: metadata.checksum };
  }

  async putFile(input: ServerFileInput): Promise<StoredObject> {
    const destination = this.filePath(input.key);
    await mkdir(dirname(destination), { recursive: true });
    await rename(resolve(input.filePath), destination);
    return this.completeUpload({ bucket: input.bucket, key: input.key, expectedSize: input.byteSize, expectedChecksum: input.checksum });
  }

  async headObject(ref: ObjectRef): Promise<ObjectMetadata | null> {
    try {
      const info = await stat(this.filePath(ref.key));
      const checksum = createHash('sha256').update(await readFile(this.filePath(ref.key))).digest('hex');
      return { size: info.size, checksum };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  async getObject(ref: ObjectRef): Promise<ReadableObject | null> {
    const metadata = await this.headObject(ref);
    if (!metadata) return null;
    return { ...ref, stream: createReadStream(this.filePath(ref.key)), size: metadata.size };
  }

  async getReadUrl(ref: ObjectRef): Promise<string> {
    return `local://${this.filePath(ref.key)}`;
  }

  async deleteObject(ref: ObjectRef): Promise<void> {
    try { await unlink(this.filePath(ref.key)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }

  async copyObject(input: { source: ObjectRef; destination: ObjectRef }): Promise<StoredObject> {
    const source = await readFile(this.filePath(input.source.key));
    const destination = this.filePath(input.destination.key);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(this.filePath(input.source.key), destination);
    return this.completeUpload({ ...input.destination, expectedSize: source.byteLength });
  }

  private filePath(key: string): string {
    const root = resolve(this.root);
    const path = resolve(join(root, key));
    if (!path.startsWith(`${root}/`) && path !== root) throw new ApiError('INVALID_OBJECT_KEY', 'Object key không hợp lệ.', {}, 422);
    return path;
  }
}
