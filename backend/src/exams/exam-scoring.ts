import { isAnswerCorrect } from '@/learning/answer-evaluator';

export type ExamSectionKindValue = 'LISTENING' | 'READING';
export type ScoreSourceValue = 'OFFICIAL_TABLE' | 'ESTIMATED' | 'RAW_ONLY';

export interface ExamQuestionForScoring {
  id: string;
  answerKey: string | null;
  /** Null on a flat test that has no sections; then the whole paper is scored as one pool. */
  section?: ExamSectionKindValue | null;
}

export interface ExamAnswerForScoring {
  questionId: string;
  selectedAnswer: string | null;
}

/** One row of a test form's own raw-to-scaled table, as published by whoever owns the form. */
export interface ScoreConversionRow {
  section: ExamSectionKindValue;
  rawCorrect: number;
  scaled: number;
}

export interface SectionScore {
  total: number;
  correct: number;
  scaled: number | null;
}

export interface ExamScore {
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  listeningCorrect: number | null;
  readingCorrect: number | null;
  listeningScaled: number | null;
  readingScaled: number | null;
  score: number | null;
  scoreSource: ScoreSourceValue;
}

const SECTION_MIN = 5;
const SECTION_MAX = 495;
const TOTAL_MIN = 10;
const TOTAL_MAX = 990;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step;
}

/**
 * A section's scaled score when the form publishes no table of its own. TOEIC reports each
 * section on 5–495 in steps of 5, so the estimate lands on the same grid — but it is only ever
 * returned alongside `scoreSource: 'ESTIMATED'` so no caller can mistake it for a real score.
 */
export function estimateSectionScaled(correct: number, total: number): number {
  if (total <= 0) return SECTION_MIN;
  const ratio = clamp(correct / total, 0, 1);
  return clamp(roundToStep(SECTION_MIN + ratio * (SECTION_MAX - SECTION_MIN), 5), SECTION_MIN, SECTION_MAX);
}

/** Same idea for a test with no sections at all, on the 10–990 total scale. */
export function estimateTotalScaled(correct: number, total: number): number {
  if (total <= 0) return TOTAL_MIN;
  const ratio = clamp(correct / total, 0, 1);
  return clamp(roundToStep(TOTAL_MIN + ratio * (TOTAL_MAX - TOTAL_MIN), 5), TOTAL_MIN, TOTAL_MAX);
}

/** Exact raw match wins; otherwise fall back to the closest published row for that section. */
export function lookupScaled(rows: ScoreConversionRow[], section: ExamSectionKindValue, rawCorrect: number): number | null {
  const forSection = rows.filter((row) => row.section === section);
  if (!forSection.length) return null;
  const exact = forSection.find((row) => row.rawCorrect === rawCorrect);
  if (exact) return exact.scaled;
  return forSection.reduce((closest, row) =>
    Math.abs(row.rawCorrect - rawCorrect) < Math.abs(closest.rawCorrect - rawCorrect) ? row : closest
  ).scaled;
}

export function scoreExam(
  questions: ExamQuestionForScoring[],
  answers: ExamAnswerForScoring[],
  conversions: ScoreConversionRow[] = []
): ExamScore {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.selectedAnswer]));
  const isCorrect = (question: ExamQuestionForScoring) => isAnswerCorrect(question.answerKey, answerMap.get(question.id));

  const total = questions.length;
  const correct = questions.filter(isCorrect).length;
  const unanswered = questions.filter((question) => !answerMap.get(question.id)).length;
  const wrong = total - correct - unanswered;

  const sectioned = questions.filter((question) => question.section === 'LISTENING' || question.section === 'READING');
  const base = { total, correct, wrong, unanswered };

  if (total === 0) {
    return { ...base, listeningCorrect: null, readingCorrect: null, listeningScaled: null, readingScaled: null, score: null, scoreSource: 'RAW_ONLY' };
  }

  // A flat test cannot be reported the way TOEIC reports one, so it stays an explicit estimate.
  if (!sectioned.length) {
    return { ...base, listeningCorrect: null, readingCorrect: null, listeningScaled: null, readingScaled: null, score: estimateTotalScaled(correct, total), scoreSource: 'ESTIMATED' };
  }

  const sectionScore = (kind: ExamSectionKindValue): SectionScore => {
    const items = questions.filter((question) => question.section === kind);
    const sectionCorrect = items.filter(isCorrect).length;
    const fromTable = lookupScaled(conversions, kind, sectionCorrect);
    return { total: items.length, correct: sectionCorrect, scaled: items.length ? fromTable ?? estimateSectionScaled(sectionCorrect, items.length) : null };
  };

  const listening = sectionScore('LISTENING');
  const reading = sectionScore('READING');
  const usedTable = (['LISTENING', 'READING'] as const).every((kind) => {
    const items = questions.filter((question) => question.section === kind);
    return !items.length || lookupScaled(conversions, kind, items.filter(isCorrect).length) !== null;
  });

  const scaledParts = [listening.scaled, reading.scaled].filter((value): value is number => value !== null);

  return {
    ...base,
    listeningCorrect: listening.total ? listening.correct : null,
    readingCorrect: reading.total ? reading.correct : null,
    listeningScaled: listening.scaled,
    readingScaled: reading.scaled,
    score: scaledParts.length ? scaledParts.reduce((sum, value) => sum + value, 0) : null,
    scoreSource: usedTable && conversions.length ? 'OFFICIAL_TABLE' : 'ESTIMATED'
  };
}
