import { ContentStatus, QuestionKind } from '@prisma/client';
import { PracticeService } from './practice.service';

describe('PracticeService', () => {
  it('returns practice questions without answer keys', async () => {
    const prisma = { question: { findMany: jest.fn().mockResolvedValue([{ id: 'q1', kind: QuestionKind.GRAMMAR, part: 5, level: 1, prompt: { text: 'Choose one.' }, answerKey: 'B', options: [{ key: 'A', text: { text: 'a' } }, { key: 'B', text: { text: 'b' } }] }]) } } as never;
    const result = await new PracticeService(prisma).questions({ kind: QuestionKind.GRAMMAR, limit: 20 });
    expect(result[0]).toEqual({ id: 'q1', kind: QuestionKind.GRAMMAR, part: 5, level: 1, prompt: { text: 'Choose one.' }, options: [{ key: 'A', text: { text: 'a' } }, { key: 'B', text: { text: 'b' } }] });
    expect(JSON.stringify(result)).not.toContain('answerKey');
    expect((prisma as any).question.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: ContentStatus.PUBLISHED }) }));
  });
});
