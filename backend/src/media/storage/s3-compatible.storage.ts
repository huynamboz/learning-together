import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ApiError } from '@/common/http/api-error';
import { toReadable } from './storage.types';
import type {
  CompleteUploadInput,
  CreateUploadInput,
  ObjectMetadata,
  ObjectRef,
  ObjectStorage,
  ReadableObject,
  ServerFileInput,
  StoredObject,
  UploadInstructions,
  StorageProviderName
} from './storage.types';

export interface S3CompatibleOptions {
  name: Exclude<StorageProviderName, 'local'>;
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

@Injectable()
export class S3CompatibleStorage implements ObjectStorage {
  readonly name: Exclude<StorageProviderName, 'local'>;
  private readonly client: S3Client;

  constructor(options: S3CompatibleOptions) {
    this.name = options.name;
    this.client = new S3Client({
      endpoint: options.endpoint,
      region: options.region,
      forcePathStyle: Boolean(options.endpoint),
      credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey }
    });
  }

  async createUpload(input: CreateUploadInput): Promise<UploadInstructions> {
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    const url = await getSignedUrl(this.client, new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      ContentType: input.mimeType,
      ContentLength: input.byteSize
    }), { expiresIn: input.expiresInSeconds });
    return { mode: 'direct', provider: this.name, method: 'PUT', url, headers: { 'content-type': input.mimeType }, expiresAt };
  }

  async completeUpload(input: CompleteUploadInput): Promise<StoredObject> {
    const metadata = await this.headObject(input);
    if (!metadata) throw new ApiError('OBJECT_NOT_FOUND', 'Tệp chưa được upload.', {}, 409);
    if (metadata.size !== input.expectedSize) throw new ApiError('OBJECT_SIZE_MISMATCH', 'Kích thước tệp không khớp.', { expected: input.expectedSize, actual: metadata.size }, 422);
    if (input.expectedChecksum && metadata.checksum && input.expectedChecksum !== metadata.checksum) {
      throw new ApiError('OBJECT_CHECKSUM_MISMATCH', 'Checksum tệp không khớp.', {}, 422);
    }
    return { ...input, provider: this.name, size: metadata.size, checksum: metadata.checksum, etag: metadata.etag };
  }

  async putFile(input: ServerFileInput): Promise<StoredObject> {
    await this.client.send(new PutObjectCommand({ Bucket: input.bucket, Key: input.key, Body: createReadStream(input.filePath), ContentType: input.mimeType, ContentLength: input.byteSize }));
    return this.completeUpload({ bucket: input.bucket, key: input.key, expectedSize: input.byteSize, expectedChecksum: input.checksum });
  }

  async headObject(ref: ObjectRef): Promise<ObjectMetadata | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: ref.bucket, Key: ref.key }));
      return { size: Number(result.ContentLength ?? 0), checksum: result.ChecksumSHA256, etag: result.ETag?.replaceAll('"', ''), contentType: result.ContentType };
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return null;
      throw error;
    }
  }

  async getObject(ref: ObjectRef): Promise<ReadableObject | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: ref.bucket, Key: ref.key }));
      if (!result.Body) return null;
      return {
        ...ref,
        stream: toReadable(result.Body as NodeJS.ReadableStream),
        size: result.ContentLength === undefined ? undefined : Number(result.ContentLength),
        contentType: result.ContentType
      };
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return null;
      throw error;
    }
  }

  async getReadUrl(ref: ObjectRef, expiresInSeconds = 300): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: ref.bucket, Key: ref.key, ResponseContentDisposition: `inline; filename="${basename(ref.key)}"` }), { expiresIn: expiresInSeconds });
  }

  async deleteObject(ref: ObjectRef): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: ref.bucket, Key: ref.key }));
  }

  async copyObject(input: { source: ObjectRef; destination: ObjectRef }): Promise<StoredObject> {
    await this.client.send(new CopyObjectCommand({ Bucket: input.destination.bucket, Key: input.destination.key, CopySource: `${input.source.bucket}/${input.source.key}` }));
    return this.completeUpload({ ...input.destination, expectedSize: Number((await this.headObject(input.destination))?.size ?? 0) });
  }
}
