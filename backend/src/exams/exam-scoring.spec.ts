import { estimateSectionScaled, lookupScaled, scoreExam, type ScoreConversionRow } from './exam-scoring';

const listening = (id: string, answerKey: string) => ({ id, answerKey, section: 'LISTENING' as const });
const reading = (id: string, answerKey: string) => ({ id, answerKey, section: 'READING' as const });

describe('exam scoring', () => {
  it('separates correct, wrong and unanswered answers', () => {
    const result = scoreExam(
      [{ id: '1', answerKey: 'A' }, { id: '2', answerKey: 'B' }, { id: '3', answerKey: 'C' }],
      [{ questionId: '1', selectedAnswer: 'a' }, { questionId: '2', selectedAnswer: 'D' }]
    );
    expect(result).toMatchObject({ total: 3, correct: 1, wrong: 1, unanswered: 1 });
  });

  it('marks a flat test as an estimate rather than reporting it like a real TOEIC score', () => {
    const result = scoreExam([{ id: '1', answerKey: 'A' }, { id: '2', answerKey: 'B' }], [{ questionId: '1', selectedAnswer: 'A' }]);
    expect(result.scoreSource).toBe('ESTIMATED');
    expect(result.listeningScaled).toBeNull();
    expect(result.readingScaled).toBeNull();
    expect(result.score).toBeGreaterThan(10);
  });

  it('reports nothing at all for an empty paper instead of inventing a zero score', () => {
    expect(scoreExam([], [])).toMatchObject({ total: 0, score: null, scoreSource: 'RAW_ONLY' });
  });

  describe('with sections', () => {
    const questions = [listening('l1', 'A'), listening('l2', 'B'), reading('r1', 'C'), reading('r2', 'D')];

    it('scores each section on its own answers, not on the combined total', () => {
      const result = scoreExam(questions, [
        { questionId: 'l1', selectedAnswer: 'A' },
        { questionId: 'l2', selectedAnswer: 'B' },
        { questionId: 'r1', selectedAnswer: 'X' },
        { questionId: 'r2', selectedAnswer: 'X' }
      ]);
      expect(result.listeningCorrect).toBe(2);
      expect(result.readingCorrect).toBe(0);
      expect(result.listeningScaled).toBe(495);
      expect(result.readingScaled).toBe(5);
      expect(result.score).toBe(500);
    });

    it('lets a published table separate mirrored section results that an estimate cannot', () => {
      const strongListening = scoreExam(questions, [{ questionId: 'l1', selectedAnswer: 'A' }, { questionId: 'l2', selectedAnswer: 'B' }]);
      const strongReading = scoreExam(questions, [{ questionId: 'r1', selectedAnswer: 'C' }, { questionId: 'r2', selectedAnswer: 'D' }]);
      const table: ScoreConversionRow[] = [
        { section: 'LISTENING', rawCorrect: 0, scaled: 5 },
        { section: 'LISTENING', rawCorrect: 2, scaled: 495 },
        { section: 'READING', rawCorrect: 0, scaled: 5 },
        { section: 'READING', rawCorrect: 2, scaled: 400 }
      ];
      expect(scoreExam(questions, [{ questionId: 'l1', selectedAnswer: 'A' }, { questionId: 'l2', selectedAnswer: 'B' }], table).score).toBe(500);
      expect(scoreExam(questions, [{ questionId: 'r1', selectedAnswer: 'C' }, { questionId: 'r2', selectedAnswer: 'D' }], table).score).toBe(405);
      // Without a table both mirrors happen to match; the table is what makes them differ.
      expect(strongListening.score).toBe(strongReading.score);
    });

    it('uses the published table when the form has one and says so', () => {
      const table: ScoreConversionRow[] = [
        { section: 'LISTENING', rawCorrect: 1, scaled: 300 },
        { section: 'READING', rawCorrect: 1, scaled: 275 }
      ];
      const result = scoreExam(questions, [{ questionId: 'l1', selectedAnswer: 'A' }, { questionId: 'r1', selectedAnswer: 'C' }], table);
      expect(result.scoreSource).toBe('OFFICIAL_TABLE');
      expect(result.score).toBe(575);
    });

    it('falls back to the closest published row when an exact raw score is missing', () => {
      const table: ScoreConversionRow[] = [
        { section: 'LISTENING', rawCorrect: 0, scaled: 5 },
        { section: 'LISTENING', rawCorrect: 3, scaled: 400 }
      ];
      expect(lookupScaled(table, 'LISTENING', 2)).toBe(400);
      expect(lookupScaled(table, 'READING', 2)).toBeNull();
    });

    it('labels the result an estimate when the form publishes no table', () => {
      expect(scoreExam(questions, [{ questionId: 'l1', selectedAnswer: 'A' }]).scoreSource).toBe('ESTIMATED');
    });
  });

  describe('section estimate', () => {
    it('stays on the reported 5-495 grid', () => {
      expect(estimateSectionScaled(0, 100)).toBe(5);
      expect(estimateSectionScaled(100, 100)).toBe(495);
      expect(estimateSectionScaled(50, 100)).toBe(250);
      expect(estimateSectionScaled(0, 0)).toBe(5);
      expect(estimateSectionScaled(37, 100) % 5).toBe(0);
    });
  });
});
