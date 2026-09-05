import { Injectable } from '@nestjs/common';
import { ContentType, ImportStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

export interface ImportRow {
  externalKey?: unknown;
  type?: unknown;
  title?: unknown;
  payload?: unknown;
}

export interface ImportValidation {
  valid: boolean;
  errors: Array<{ rowNumber: number; field: string; message: string }>;
  normalized: Array<{ rowNumber: number; externalKey: string; type: ContentType; title: string; payload: Record<string, unknown> }>;
}

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  validateRows(rows: ImportRow[]): ImportValidation {
    const errors: ImportValidation['errors'] = [];
    const normalized: ImportValidation['normalized'] = [];
    const keys = new Set<string>();
    rows.forEach((row, index) => {
      const rowNumber = index + 1;
      const externalKey = typeof row.externalKey === 'string' ? row.externalKey.trim() : '';
      const type = typeof row.type === 'string' ? row.type : '';
      const title = typeof row.title === 'string' ? row.title.trim() : '';
      if (!externalKey) errors.push({ rowNumber, field: 'externalKey', message: 'Bắt buộc.' });
      if (externalKey && keys.has(externalKey)) errors.push({ rowNumber, field: 'externalKey', message: 'Trùng trong batch.' });
      if (externalKey) keys.add(externalKey);
      if (!Object.values(ContentType).includes(type as ContentType)) errors.push({ rowNumber, field: 'type', message: 'Content type không hợp lệ.' });
      if (!title) errors.push({ rowNumber, field: 'title', message: 'Bắt buộc.' });
      if (!row.payload || typeof row.payload !== 'object' || Array.isArray(row.payload)) errors.push({ rowNumber, field: 'payload', message: 'Phải là object JSON.' });
      if (externalKey && title && Object.values(ContentType).includes(type as ContentType) && row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)) normalized.push({ rowNumber, externalKey, type: type as ContentType, title, payload: row.payload as Record<string, unknown> });
    });
    return { valid: errors.length === 0, errors, normalized };
  }

  async createBatch(actorId: string, sourceName: string, schema: string, rows: ImportRow[]) {
    const validation = this.validateRows(rows);
    const batch = await this.prisma.importBatch.create({ data: { createdById: actorId, sourceName, schema, status: validation.valid ? ImportStatus.READY_TO_IMPORT : ImportStatus.FAILED, summary: { total: rows.length, valid: validation.normalized.length, errors: validation.errors.length } as Prisma.InputJsonValue, items: { create: rows.map((row, index) => ({ rowNumber: index + 1, externalKey: typeof row.externalKey === 'string' ? row.externalKey : `row-${index + 1}`, status: validation.errors.some((error) => error.rowNumber === index + 1) ? 'INVALID' : 'READY', payload: (row.payload && typeof row.payload === 'object' ? row.payload : {}) as Prisma.InputJsonValue, error: validation.errors.filter((error) => error.rowNumber === index + 1).map((error) => `${error.field}: ${error.message}`).join('; ') || null })) } } });
    return { batchId: batch.id, ...validation };
  }
}
