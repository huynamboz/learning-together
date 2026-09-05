import { scheduleReview } from './srs';

describe('SRS scheduler', () => {
  const now = new Date('2026-09-06T00:00:00.000Z');

  it('uses a short relearning interval for again', () => {
    const result = scheduleReview({ state: 'NEW', intervalDays: 0, ease: 2.5, repetitions: 0, lapses: 0 }, 'again', now);
    expect(result.state).toBe('LEARNING');
    expect(result.dueAt.getTime() - now.getTime()).toBe(5 * 60 * 1000);
    expect(result.lapses).toBe(1);
  });

  it('uses the product intervals for hard, good and easy', () => {
    expect(scheduleReview({ state: 'REVIEW', intervalDays: 2, ease: 2.5, repetitions: 2, lapses: 0 }, 'hard', now).dueAt.getTime() - now.getTime()).toBe(6 * 60 * 60 * 1000);
    expect(scheduleReview({ state: 'NEW', intervalDays: 0, ease: 2.5, repetitions: 0, lapses: 0 }, 'good', now).intervalDays).toBe(1);
    expect(scheduleReview({ state: 'NEW', intervalDays: 0, ease: 2.5, repetitions: 0, lapses: 0 }, 'easy', now).intervalDays).toBe(3);
  });

  it('promotes a mature easy card to mastered', () => {
    const result = scheduleReview({ state: 'REVIEW', intervalDays: 10, ease: 2.5, repetitions: 5, lapses: 0 }, 'easy', now);
    expect(result.state).toBe('MASTERED');
    expect(result.repetitions).toBe(6);
  });
});
