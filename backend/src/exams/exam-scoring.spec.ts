import { scoreExam } from './exam-scoring';

describe('exam scoring', () => {
  it('separates correct, wrong and unanswered answers', () => {
    expect(scoreExam([{ id: '1', answerKey: 'A' }, { id: '2', answerKey: 'B' }, { id: '3', answerKey: 'C' }], [{ questionId: '1', selectedAnswer: 'a' }, { questionId: '2', selectedAnswer: 'D' }])).toEqual({ total: 3, correct: 1, wrong: 1, unanswered: 1, score: 330 });
  });
});
