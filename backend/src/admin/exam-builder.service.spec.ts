import { ContentLicense, ContentStatus, ExamSectionKind, MediaStatus, QuestionGroupType, QuestionKind } from '@prisma/client';
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

  describe('licence', () => {
    it('refuses to publish a paper marked restricted', async () => {
      const prisma = { mockTest: { findUnique: jest.fn().mockResolvedValue({ id: 't1', title: 'ETS form', license: ContentLicense.RESTRICTED, _count: { questions: 20 } }) } };
      await expect(serviceWith(prisma).publish('t1', 'admin-1')).rejects.toMatchObject({ code: 'MOCK_TEST_RESTRICTED' });
    });

    it('pulls a live paper back to draft when it is marked restricted', async () => {
      const tx = { mockTest: { update: jest.fn().mockResolvedValue({ id: 't1', status: ContentStatus.DRAFT }) }, auditLog: { create: jest.fn() } };
      const prisma = {
        mockTest: { findUnique: jest.fn().mockResolvedValue({ id: 't1', status: ContentStatus.PUBLISHED }) },
        $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
      };
      await serviceWith(prisma).updateTest('t1', 'admin-1', { license: ContentLicense.RESTRICTED });
      expect(tx.mockTest.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: ContentStatus.DRAFT }) }));
      expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'MOCK_TEST_RESTRICTED_UNPUBLISHED' }) }));
    });
  });

  describe('deleting a group', () => {
    it('takes its questions and their test enrolment with it', async () => {
      const tx = {
        mockTestQuestion: { deleteMany: jest.fn() },
        question: { deleteMany: jest.fn() },
        questionGroup: { delete: jest.fn() },
        auditLog: { create: jest.fn() }
      };
      const prisma = {
        questionGroup: { findUnique: jest.fn().mockResolvedValue({ id: 'g1', sectionId: 's1', questions: [{ id: 'q1' }, { id: 'q2' }] }) },
        $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
      };
      await expect(serviceWith(prisma).deleteGroup('g1', 'admin-1')).resolves.toEqual({ groupId: 'g1', removedQuestions: 2 });
      expect(tx.mockTestQuestion.deleteMany).toHaveBeenCalledWith({ where: { questionId: { in: ['q1', 'q2'] } } });
      expect(tx.question.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['q1', 'q2'] } } });
    });
  });

  describe('reordering groups', () => {
    const prismaWith = (ids: string[], tx: Record<string, unknown>) => ({
      questionGroup: { findMany: jest.fn().mockResolvedValue(ids.map((id) => ({ id }))) },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
    });

    it('parks rows out of range first so the unique order never clashes mid-write', async () => {
      const tx = { questionGroup: { update: jest.fn() }, auditLog: { create: jest.fn() } };
      await serviceWith(prismaWith(['a', 'b'], tx)).reorderGroups('s1', 'admin-1', { groupIds: ['b', 'a'] });
      const orders = tx.questionGroup.update.mock.calls.map((call) => call[0].data.sortOrder);
      expect(orders).toEqual([-1, -2, 1, 2]);
    });

    it('refuses a list that does not name exactly the section groups', async () => {
      const tx = { questionGroup: { update: jest.fn() }, auditLog: { create: jest.fn() } };
      await expect(serviceWith(prismaWith(['a', 'b'], tx)).reorderGroups('s1', 'admin-1', { groupIds: ['a'] }))
        .rejects.toMatchObject({ code: 'GROUP_ORDER_MISMATCH' });
    });

    it('refuses a list that repeats a group', async () => {
      const tx = { questionGroup: { update: jest.fn() }, auditLog: { create: jest.fn() } };
      await expect(serviceWith(prismaWith(['a', 'b'], tx)).reorderGroups('s1', 'admin-1', { groupIds: ['a', 'a'] }))
        .rejects.toMatchObject({ code: 'DUPLICATE_GROUP_IN_ORDER' });
    });
  });

  describe('editing a question', () => {
    it('checks the answer key against the replacement options, not the old ones', async () => {
      const prisma = { question: { findUnique: jest.fn().mockResolvedValue({ id: 'q1', answerKey: 'D', options: [{ key: 'D' }] }) } };
      await expect(serviceWith(prisma).updateQuestion('q1', 'admin-1', { options: [{ key: 'A', text: 'one' }, { key: 'B', text: 'two' }] }))
        .rejects.toMatchObject({ code: 'ANSWER_KEY_NOT_IN_OPTIONS' });
    });

    it('replaces the option set wholesale so no orphan letter survives', async () => {
      const tx = {
        questionOption: { deleteMany: jest.fn(), createMany: jest.fn() },
        question: { update: jest.fn().mockResolvedValue({ id: 'q1' }) },
        auditLog: { create: jest.fn() }
      };
      const prisma = {
        question: { findUnique: jest.fn().mockResolvedValue({ id: 'q1', answerKey: 'A', options: [{ key: 'A' }, { key: 'B' }, { key: 'C' }] }) },
        $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx))
      };
      await serviceWith(prisma).updateQuestion('q1', 'admin-1', { answerKey: 'a', options: [{ key: 'A', text: 'one' }, { key: 'B', text: 'two' }] });
      expect(tx.questionOption.deleteMany).toHaveBeenCalledWith({ where: { questionId: 'q1' } });
      expect(tx.question.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ answerKey: 'A' }) }));
    });
  });
});
