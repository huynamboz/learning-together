import { LearningService } from './learning.service';

describe('LearningService study sessions', () => {
  it('stores a completed session with a bounded client-reported duration', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'session-1', surface: 'listening', durationSeconds: 42, endedAt: new Date() });
    const service = new LearningService({ studySession: { create } } as never);

    await expect(service.recordStudySession('user-1', { surface: 'listening', durationSeconds: 42 })).resolves.toMatchObject({ id: 'session-1', durationSeconds: 42 });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'user-1', surface: 'listening', durationSeconds: 42, startedAt: expect.any(Date), endedAt: expect.any(Date) }),
      select: { id: true, surface: true, durationSeconds: true, endedAt: true }
    }));
  });
});
