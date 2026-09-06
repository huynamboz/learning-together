import { ExamSectionKind, MediaStatus, QuestionGroupType, QuestionKind } from '@prisma/client';
import { ExamBuilderService } from './exam-builder.service';

const readyPublicImage = { status: MediaStatus.READY, visibility: 'public', mimeType: 'image/jpeg' };
const options = [{ key: 'A', text: 'first' }, { key: 'B', text: 'second' }];

function serviceWith(prisma: Record<string, unknown>) {
  return new ExamBuilderService(prisma as never);
}

describe('ExamBuilderService', () => {
  describe('adding a question to a group', () => {
    const group = { id: 'g1', part: 3, sectionId: 's1', section: { testId: 't1' } };

    it('enrols the question in the test and carries its section along', async () => {
      const tx = {
        question: { create: jest.fn().mockResolvedValue({ id: 'q1', numberInTest: 32 }) },
        mockTestQuestion: { create: jest.fn() },
        auditLog: { create: jest.fn() }
      };
      const prisma = {
        questionGroup: { findUnique: jest.fn().mockResolvedValue(group) },
        mockTestQuestion: { findFirst: jest.fn().mockResolvedValue({ sortOrder: 7 }) },
        $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
      };
      await expect(serviceWith(prisma).addQuestion('g1', 'admin-1', {
        kind: QuestionKind.LISTENING, prompt: 'Why is the woman calling?', answerKey: 'b', numberInTest: 32, options
      })).resolves.toMatchObject({ id: 'q1' });

      expect(tx.mockTestQuestion.create).toHaveBeenCalledWith({ data: { testId: 't1', questionId: 'q1', sectionId: 's1', sortOrder: 8, part: 3 } });
      // The key is normalised so a lower-case answer still matches an upper-case option.
      expect(tx.question.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ answerKey: 'B' }) }));
      expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'EXAM_QUESTION_CREATED' }) }));
    });

    it('refuses an answer key that is not one of the options', async () => {
      const prisma = { questionGroup: { findUnique: jest.fn().mockResolvedValue(group) } };
      await expect(serviceWith(prisma).addQuestion('g1', 'admin-1', {
        kind: QuestionKind.LISTENING, prompt: 'Prompt', answerKey: 'D', options
      })).rejects.toMatchObject({ code: 'ANSWER_KEY_NOT_IN_OPTIONS' });
    });

    it('refuses two options sharing a letter', async () => {
      const prisma = { questionGroup: { findUnique: jest.fn().mockResolvedValue(group) } };
      await expect(serviceWith(prisma).addQuestion('g1', 'admin-1', {
        kind: QuestionKind.LISTENING, prompt: 'Prompt', answerKey: 'A', options: [{ key: 'A', text: 'one' }, { key: 'a', text: 'two' }]
      })).rejects.toMatchObject({ code: 'DUPLICATE_OPTION_KEY' });
    });

    it('refuses a group that does not belong to a test yet', async () => {
      const prisma = { questionGroup: { findUnique: jest.fn().mockResolvedValue({ id: 'g1', part: 5, sectionId: null, section: null }) } };
      await expect(serviceWith(prisma).addQuestion('g1', 'admin-1', {
        kind: QuestionKind.GRAMMAR, prompt: 'Prompt', answerKey: 'A', options
      })).rejects.toMatchObject({ code: 'GROUP_NOT_IN_TEST' });
    });
  });

  describe('attaching media to a group', () => {
    it('accepts an ordered image on a part that prints one', async () => {
      const tx = { questionGroupMedia: { upsert: jest.fn().mockResolvedValue({ groupId: 'g1', assetId: 'a1', role: 'photo' }) }, auditLog: { create: jest.fn() } };
      const prisma = {
        questionGroup: { findUnique: jest.fn().mockResolvedValue({ id: 'g1', part: 1 }) },
        mediaAsset: { findUnique: jest.fn().mockResolvedValue(readyPublicImage) },
        questionGroupMedia: { findFirst: jest.fn().mockResolvedValue({ sortOrder: 2 }) },
        $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
      };
      await expect(serviceWith(prisma).attachMedia('g1', 'admin-1', { assetId: 'a1' })).resolves.toMatchObject({ assetId: 'a1' });
      expect(tx.questionGroupMedia.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ sortOrder: 3 }) }));
    });

    it('refuses parts that never print an image', async () => {
      const prisma = { questionGroup: { findUnique: jest.fn().mockResolvedValue({ id: 'g1', part: 5 }) } };
      await expect(serviceWith(prisma).attachMedia('g1', 'admin-1', { assetId: 'a1' })).rejects.toMatchObject({ code: 'GROUP_TAKES_NO_MEDIA' });
    });

    it('refuses an asset that is not public yet', async () => {
      const prisma = {
        questionGroup: { findUnique: jest.fn().mockResolvedValue({ id: 'g1', part: 1 }) },
        mediaAsset: { findUnique: jest.fn().mockResolvedValue({ ...readyPublicImage, visibility: 'private' }) }
      };
      await expect(serviceWith(prisma).attachMedia('g1', 'admin-1', { assetId: 'a1' })).rejects.toMatchObject({ code: 'ASSET_NOT_PUBLIC' });
    });

    it('refuses audio where an image belongs', async () => {
      const prisma = {
        questionGroup: { findUnique: jest.fn().mockResolvedValue({ id: 'g1', part: 1 }) },
        mediaAsset: { findUnique: jest.fn().mockResolvedValue({ ...readyPublicImage, mimeType: 'audio/mpeg' }) }
      };
      await expect(serviceWith(prisma).attachMedia('g1', 'admin-1', { assetId: 'a1' })).rejects.toMatchObject({ code: 'ASSET_MIME_MISMATCH' });
    });
  });

  describe('score conversion table', () => {
    it('replaces the table in one transaction so a result is never scored against a half-written one', async () => {
      const tx = { scoreConversion: { deleteMany: jest.fn(), createMany: jest.fn() }, auditLog: { create: jest.fn() } };
      const prisma = {
        mockTest: { findUnique: jest.fn().mockResolvedValue({ id: 't1' }) },
        $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
      };
      await expect(serviceWith(prisma).replaceConversions('t1', 'admin-1', {
        rows: [{ section: ExamSectionKind.LISTENING, rawCorrect: 0, scaled: 5 }, { section: ExamSectionKind.READING, rawCorrect: 0, scaled: 5 }]
      })).resolves.toEqual({ testId: 't1', rows: 2 });
      expect(tx.scoreConversion.deleteMany).toHaveBeenCalledWith({ where: { testId: 't1' } });
    });

    it('refuses two rows for the same section and raw score', async () => {
      const prisma = { mockTest: { findUnique: jest.fn().mockResolvedValue({ id: 't1' }) } };
      await expect(serviceWith(prisma).replaceConversions('t1', 'admin-1', {
        rows: [{ section: ExamSectionKind.LISTENING, rawCorrect: 3, scaled: 100 }, { section: ExamSectionKind.LISTENING, rawCorrect: 3, scaled: 200 }]
      })).rejects.toMatchObject({ code: 'DUPLICATE_CONVERSION_ROW' });
    });
  });

  describe('publishing', () => {
    it('refuses to publish a paper with no questions', async () => {
      const prisma = { mockTest: { findUnique: jest.fn().mockResolvedValue({ id: 't1', title: 'Empty', _count: { questions: 0 } }) } };
      await expect(serviceWith(prisma).publish('t1', 'admin-1')).rejects.toMatchObject({ code: 'MOCK_TEST_EMPTY' });
    });
  });

  describe('creating a group', () => {
    it('refuses a section that belongs to another test', async () => {
      const prisma = { mockTestSection: { findFirst: jest.fn().mockResolvedValue(null) } };
      await expect(serviceWith(prisma).addGroup('t1', 'admin-1', {
        sectionId: 's-other', type: QuestionGroupType.CONVERSATION, part: 3
      })).rejects.toMatchObject({ code: 'SECTION_NOT_IN_TEST' });
    });
  });
});
