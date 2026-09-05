import { countWords, WritingService } from './writing.service';

describe('writing service helpers', () => {
  it('counts words consistently for the UI limit', () => {
    expect(countWords('  Write   one clear sentence. ')).toBe(4);
    expect(countWords('')).toBe(0);
  });
});

describe('writing history', () => {
  it('scopes history to its owner and returns the newest twenty submissions', async () => {
    const findMany = jest.fn().mockResolvedValue([{ id: 'submission-1', part: 1, wordCount: 90, status: 'GRADING', grade: null }]);
    const result = await new WritingService({ writingSubmission: { findMany } } as never).list('user-1');

    expect(result).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' }, orderBy: { createdAt: 'desc' }, take: 20 }));
  });
});
