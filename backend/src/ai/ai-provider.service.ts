import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { ApiError } from '@/common/http/api-error';
import { CreateAiProviderDto, ReorderAiProvidersDto, UpdateAiProviderDto } from './ai-provider.dto';
import { encryptSecret, keyFingerprint, MissingEncryptionKeyError, readEncryptionKey } from './secret-box';

/** Everything the console is allowed to see. `apiKeyCipher` is deliberately absent. */
const PUBLIC_FIELDS = {
  id: true, name: true, baseUrl: true, model: true, apiKeyLast4: true, enabled: true, priority: true,
  timeoutMs: true, maxRetries: true, extraHeaders: true, health: true, lastCheckedAt: true,
  lastLatencyMs: true, lastError: true, createdAt: true, updatedAt: true
} as const;

@Injectable()
export class AiProviderService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private encryptionKey() {
    try {
      return readEncryptionKey(this.config.get<string>('ai.encryptionKey'));
    } catch (error) {
      if (error instanceof MissingEncryptionKeyError) {
        throw new ApiError('AI_ENCRYPTION_KEY_MISSING', 'Server chưa cấu hình AI_ENCRYPTION_KEY nên chưa thể lưu khoá provider.', {}, 503);
      }
      throw new ApiError('AI_ENCRYPTION_KEY_INVALID', error instanceof Error ? error.message : 'AI_ENCRYPTION_KEY không hợp lệ.', {}, 503);
    }
  }

  /** True when the server can store keys at all — the console warns before showing the form. */
  encryptionReady(): boolean {
    try {
      readEncryptionKey(this.config.get<string>('ai.encryptionKey'));
      return true;
    } catch {
      return false;
    }
  }

  list() {
    return this.prisma.aiProvider.findMany({ orderBy: { priority: 'asc' }, select: PUBLIC_FIELDS });
  }

  private audit(tx: Prisma.TransactionClient, actorId: string, action: string, entityId: string, metadata: Prisma.InputJsonValue) {
    return tx.auditLog.create({ data: { actorId, action, entity: 'AiProvider', entityId, metadata } });
  }

  async create(actorId: string, dto: CreateAiProviderDto) {
    const key = this.encryptionKey();
    const last = await this.prisma.aiProvider.findFirst({ orderBy: { priority: 'desc' }, select: { priority: true } });

    return this.prisma.$transaction(async (tx) => {
      const provider = await tx.aiProvider.create({
        data: {
          name: dto.name.trim(),
          baseUrl: dto.baseUrl.trim().replace(/\/+$/, ''),
          model: dto.model.trim(),
          apiKeyCipher: encryptSecret(dto.apiKey.trim(), key),
          apiKeyLast4: keyFingerprint(dto.apiKey),
          enabled: dto.enabled ?? true,
          priority: (last?.priority ?? 0) + 1,
          timeoutMs: dto.timeoutMs ?? 30000,
          maxRetries: dto.maxRetries ?? 1,
          extraHeaders: (dto.extraHeaders ?? undefined) as Prisma.InputJsonValue | undefined
        },
        select: PUBLIC_FIELDS
      });
      // The key itself is never written to the audit trail, only the fact that one was set.
      await this.audit(tx, actorId, 'AI_PROVIDER_CREATED', provider.id, { name: provider.name, model: provider.model, baseUrl: provider.baseUrl });
      return provider;
    });
  }

  async update(id: string, actorId: string, dto: UpdateAiProviderDto) {
    const existing = await this.prisma.aiProvider.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Không tìm thấy provider.');
    const rotating = Boolean(dto.apiKey?.trim());
    const key = rotating ? this.encryptionKey() : null;

    return this.prisma.$transaction(async (tx) => {
      const provider = await tx.aiProvider.update({
        where: { id },
        data: {
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.baseUrl === undefined ? {} : { baseUrl: dto.baseUrl.trim().replace(/\/+$/, '') }),
          ...(dto.model === undefined ? {} : { model: dto.model.trim() }),
          ...(rotating && key ? { apiKeyCipher: encryptSecret(dto.apiKey!.trim(), key), apiKeyLast4: keyFingerprint(dto.apiKey!) } : {}),
          ...(dto.enabled === undefined ? {} : { enabled: dto.enabled }),
          ...(dto.timeoutMs === undefined ? {} : { timeoutMs: dto.timeoutMs }),
          ...(dto.maxRetries === undefined ? {} : { maxRetries: dto.maxRetries }),
          ...(dto.extraHeaders === undefined ? {} : { extraHeaders: dto.extraHeaders as Prisma.InputJsonValue })
        },
        select: PUBLIC_FIELDS
      });
      await this.audit(tx, actorId, rotating ? 'AI_PROVIDER_KEY_ROTATED' : 'AI_PROVIDER_UPDATED', id, { fields: Object.keys(dto).filter((field) => field !== 'apiKey') });
      return provider;
    });
  }

  async remove(id: string, actorId: string) {
    const provider = await this.prisma.aiProvider.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!provider) throw new NotFoundException('Không tìm thấy provider.');
    return this.prisma.$transaction(async (tx) => {
      await tx.aiProvider.delete({ where: { id } });
      await this.audit(tx, actorId, 'AI_PROVIDER_DELETED', id, { name: provider.name });
      return { id };
    });
  }

  /** The order is the fallback chain, so the list must name every provider exactly once. */
  async reorder(actorId: string, dto: ReorderAiProvidersDto) {
    const providers = await this.prisma.aiProvider.findMany({ select: { id: true } });
    const current = new Set(providers.map((provider) => provider.id));
    const incoming = new Set(dto.providerIds);
    if (incoming.size !== dto.providerIds.length) throw new ApiError('DUPLICATE_PROVIDER_IN_ORDER', 'Danh sách thứ tự có provider bị lặp.', {}, 422);
    if (incoming.size !== current.size || dto.providerIds.some((id) => !current.has(id))) {
      throw new ApiError('PROVIDER_ORDER_MISMATCH', 'Danh sách thứ tự phải chứa đúng các provider hiện có.', { expected: current.size, received: incoming.size }, 422);
    }

    return this.prisma.$transaction(async (tx) => {
      // Park priorities out of range first so the unique constraint never clashes mid-write.
      for (const [index, id] of dto.providerIds.entries()) await tx.aiProvider.update({ where: { id }, data: { priority: -(index + 1) } });
      for (const [index, id] of dto.providerIds.entries()) await tx.aiProvider.update({ where: { id }, data: { priority: index + 1 } });
      await this.audit(tx, actorId, 'AI_PROVIDER_REORDERED', dto.providerIds[0] ?? 'none', { order: dto.providerIds.length });
      return { providerIds: dto.providerIds };
    });
  }
}
