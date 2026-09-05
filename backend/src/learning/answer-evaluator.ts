export function normalizeAnswer(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

export function isAnswerCorrect(expected: string | null | undefined, actual: string | null | undefined): boolean {
  return Boolean(expected) && normalizeAnswer(expected) === normalizeAnswer(actual);
}

export function calculateExamScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 990);
}
