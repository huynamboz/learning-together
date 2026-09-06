import type { Readable } from 'node:stream';

export type StorageProviderName = 's3' | 'r2' | 'local';

export interface ObjectRef {
  bucket: string;
  key: string;
}

export interface CreateUploadInput extends ObjectRef {
  mimeType: string;
  byteSize: number;
  checksum?: string;
  expiresInSeconds: number;
}

export interface UploadInstructions {
  mode: 'direct' | 'server';
  provider: StorageProviderName;
  method: 'PUT' | 'POST';
  url?: string;
  headers?: Record<string, string>;
  expiresAt: Date;
}

export interface CompleteUploadInput extends ObjectRef {
  expectedSize: number;
  expectedChecksum?: string;
}

export interface StoredObject extends ObjectRef {
  provider: StorageProviderName;
  size: number;
  checksum?: string;
  etag?: string;
}

export interface ObjectMetadata {
  size: number;
  checksum?: string;
  etag?: string;
  contentType?: string;
}

export interface ReadableObject extends ObjectRef {
  stream: Readable;
  size?: number;
  contentType?: string;
}

export interface ServerFileInput extends ObjectRef {
  filePath: string;
  mimeType: string;
  byteSize: number;
  checksum?: string;
}

export interface ObjectStorage {
  readonly name: StorageProviderName;
  createUpload(input: CreateUploadInput): Promise<UploadInstructions>;
  completeUpload(input: CompleteUploadInput): Promise<StoredObject>;
  putFile(input: ServerFileInput): Promise<StoredObject>;
  headObject(ref: ObjectRef): Promise<ObjectMetadata | null>;
  getObject(ref: ObjectRef): Promise<ReadableObject | null>;
  getReadUrl(ref: ObjectRef, expiresInSeconds?: number): Promise<string>;
  deleteObject(ref: ObjectRef): Promise<void>;
  copyObject(input: { source: ObjectRef; destination: ObjectRef }): Promise<StoredObject>;
}

export function toReadable(input: NodeJS.ReadableStream): Readable {
  return input as Readable;
}
