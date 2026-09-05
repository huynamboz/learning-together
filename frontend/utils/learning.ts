export function countWords(body: string): number {
  const value = body.trim();
  return value ? value.split(/\s+/u).length : 0;
}

export function scoreAnswers(answers: Record<number, string>, expected: string[]): { correct: number; unanswered: number; total: number } {
  const correct = expected.reduce((total, answer, index) => total + (answers[index] === answer ? 1 : 0), 0);
  return { correct, unanswered: expected.length - Object.keys(answers).length, total: expected.length };
}
