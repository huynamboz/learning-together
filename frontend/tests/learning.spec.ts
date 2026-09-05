import { describe, expect, it } from 'vitest';
import { countWords, scoreAnswers } from '../utils/learning';

describe('learner utilities', () => {
  it('counts words safely across whitespace', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('  one\n two  three ')).toBe(3);
  });

  it('scores answers and reports unanswered questions', () => {
    expect(scoreAnswers({ 0: 'A', 2: 'C' }, ['A', 'B', 'D'])).toEqual({ correct: 1, unanswered: 1, total: 3 });
  });
});
