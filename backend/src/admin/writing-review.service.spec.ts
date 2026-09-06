import { WritingStatus } from '@prisma/client';
import { WritingReviewService } from './writing-review.service';

describe('WritingReviewService', () => {
  const dto = { overall: 7.5, rubric: { task: 7 }, feedback: { summary: 'Dùng cấu trúc câu đa dạng hơn.' } };

  it('atomically closes a grading submission, stores the manual grade and audits it', async () => {
    const tx = {
      writingSubmission: { findUnique: jest.fn().mockResolvedValue({ id: 'submission-1', status: WritingStatus.GRADING }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      writingGrade: { upsert: jest.fn().mockResolvedValue({ submissionId: 'submission-1', overall: 7.5, provider: 'manual-review' }) },
      auditLog: { create: jest.fn() }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) } as never;
    await expect(new WritingReviewService(prisma).grade('submission-1', dto, 'reviewer-1')).resolves.toMatchObject({ status: WritingStatus.GRADED, grade: { provider: 'manual-review' } });
    expect(tx.writingSubmission.updateMany).toHaveBeenCalledWith({ where: { id: 'submission-1', status: WritingStatus.GRADING }, data: { status: WritingStatus.GRADED } });
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'WRITING_GRADED' }) }));
  });

  it('does not overwrite a submission that another reviewer already closed', async () => {
    const tx = {
      writingSubmission: { findUnique: jest.fn().mockResolvedValue({ id: 'submission-1', status: WritingStatus.GRADING }), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      writingGrade: { upsert: jest.fn() },
      auditLog: { create: jest.fn() }
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) } as never;
    await expect(new WritingReviewService(prisma).grade('submission-1', dto, 'reviewer-1')).rejects.toMatchObject({ code: 'WRITING_REVIEW_CLOSED' });
    expect(tx.writingGrade.upsert).not.toHaveBeenCalled();
  });
});
