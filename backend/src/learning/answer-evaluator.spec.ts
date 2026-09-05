import { calculateExamScore, isAnswerCorrect, normalizeAnswer } from './answer-evaluator';

describe('answer evaluator', () => {
  it('normalizes whitespace and case without changing meaning', () => {
    expect(normalizeAnswer('  The   Office  ')).toBe('the office');
    expect(isAnswerCorrect('the office', ' THE office ')).toBe(true);
    expect(isAnswerCorrect('the office', 'the home')).toBe(false);
  });

  it('calculates a bounded proportional practice score', () => {
    expect(calculateExamScore(0, 100)).toBe(0);
    expect(calculateExamScore(50, 100)).toBe(495);
    expect(calculateExamScore(100, 100)).toBe(990);
    expect(calculateExamScore(1, 0)).toBe(0);
  });
});
