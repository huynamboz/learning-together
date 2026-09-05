import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { extname } from 'node:path';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaStatus, Prisma, StorageProvider, UploadStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { ApiError } from '@/common/http/api-error';
import { OBJECT_STORAGE } from './storage/storage.module';
import type { ObjectStorage, StorageProviderName } from './storage/storage.types';
import { CreateUploadSessionDto } from './media.dto';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4', 'application/pdf', 'text/plain']);

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage
  ) {}

  async createUploadSession(userId: string, dto: CreateUploadSessionDto) {
    this.validateMime(dto.mimeType);
    const provider = this.storage.name.toUpperCase() as StorageProvider;
    const key = this.objectKey(dto.purpose, dto.originalName);
    const instructions = await this.storage.createUpload({ bucket: this.bucket(), key, mimeType: dto.mimeType, byteSize: dto.byteSize, checksum: dto.checksum, expiresInSeconds: 900 });
    const expiresAt = instructions.expiresAt;
    const instructionPayload = { mode: instructions.mode, provider: instructions.provider, method: instructions.method, url: instructions.url, headers: instructions.headers };
    const asset = await this.prisma.mediaAsset.create({ data: { ownerId: userId, provider, bucket: this.bucket(), objectKey: key, originalName: dto.originalName, mimeType: dto.mimeType, byteSize: dto.byteSize, checksum: dto.checksum, status: MediaStatus.PENDING } });
    const session = await this.prisma.uploadSession.create({ data: { assetId: asset.id, createdById: userId, provider, objectKey: key, expectedSize: dto.byteSize, expectedHash: dto.checksum, instructions: instructionPayload as unknown as Prisma.InputJsonValue, expiresAt } });
    return { sessionId: session.id, assetId: asset.id, provider: this.storage.name, mode: instructions.mode, method: instructions.method, url: instructions.url, headers: instructions.headers, expiresAt };
  }

  async complete(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    if (session.status !== UploadStatus.PENDING) throw new ApiError('UPLOAD_SESSION_CLOSED', 'Upload session đã đóng.', {}, 409);
    if (session.expiresAt.getTime() < Date.now()) throw new ApiError('UPLOAD_SESSION_EXPIRED', 'Upload session đã hết hạn.', {}, 410);
    const stored = await this.storage.completeUpload({ bucket: session.asset.bucket, key: session.objectKey, expectedSize: Number(session.expectedSize), expectedChecksum: session.expectedHash ?? undefined });
    await this.prisma.$transaction([
      this.prisma.uploadSession.update({ where: { id: session.id }, data: { status: UploadStatus.COMPLETED, completedAt: new Date() } }),
      this.prisma.mediaAsset.update({ where: { id: session.assetId }, data: { status: MediaStatus.READY, checksum: stored.checksum ?? session.asset.checksum } })
    ]);
    return { assetId: session.assetId, status: MediaStatus.READY, size: stored.size };
  }

  async uploadServerFile(userId: string, sessionId: string, filePath: string, mimeType: string, byteSize: number) {
    const session = await this.getOwnedSession(userId, sessionId);
    if (this.storage.name !== 'local') throw new ApiError('DIRECT_UPLOAD_REQUIRED', 'Provider hiện tại yêu cầu upload trực tiếp.', {}, 422);
    try {
      await this.storage.putFile({ bucket: session.asset.bucket, key: session.objectKey, filePath, mimeType, byteSize });
      return this.complete(userId, sessionId);
    } finally {
      await unlink(filePath).catch(() => undefined);
    }
  }

  async abort(userId: string, sessionId: string) {
    const session = await this.getOwnedSession(userId, sessionId);
    await this.storage.deleteObject({ bucket: session.asset.bucket, key: session.objectKey });
    await this.prisma.$transaction([
      this.prisma.uploadSession.update({ where: { id: session.id }, data: { status: UploadStatus.ABORTED } }),
      this.prisma.mediaAsset.update({ where: { id: session.assetId }, data: { status: MediaStatus.DELETED } })
    ]);
    return { status: UploadStatus.ABORTED };
  }

  private async getOwnedSession(userId: string, sessionId: string) {
    const session = await this.prisma.uploadSession.findFirst({ where: { id: sessionId, createdById: userId }, include: { asset: true } });
    if (!session) throw new NotFoundException('Không tìm thấy upload session.');
    return session;
  }

  private validateMime(mimeType: string): void {
    if (!allowedMimeTypes.has(mimeType)) throw new ApiError('UNSUPPORTED_MEDIA_TYPE', 'Định dạng tệp chưa được hỗ trợ.', { mimeType }, 415);
  }

  private bucket(): string { return this.config.get<string>('storage.bucket', 'toeic-web'); }

  private objectKey(purpose: string, originalName: string): string {
    const extension = extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, '');
    const safePurpose = purpose.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 64);
    return `development/media/${safePurpose}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}${extension}`;
  }
}
