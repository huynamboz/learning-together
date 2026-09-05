import { Test } from '@nestjs/testing';
import { PrismaService } from '@/database/prisma.service';
import { ContentType } from '@prisma/client';
import { ImportService } from './import.service';

describe('ImportService', () => {
  it('reports row-level validation errors and normalized valid rows', async () => {
    const module = await Test.createTestingModule({ providers: [ImportService, { provide: PrismaService, useValue: {} }] }).compile();
    const result = module.get(ImportService).validateRows([
      { externalKey: 'listen-1', type: ContentType.LISTENING, title: 'Office', payload: { audio: 'a.mp3' } },
      { externalKey: 'listen-1', type: 'NOPE', title: '', payload: [] }
    ]);
    expect(result.valid).toBe(false);
    expect(result.normalized).toHaveLength(1);
    expect(result.errors.map((error) => error.field)).toEqual(['externalKey', 'type', 'title', 'payload']);
  });
});
