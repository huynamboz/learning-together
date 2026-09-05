export type SrsRating = 'again' | 'hard' | 'good' | 'easy';
export type SrsState = 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';

export interface SrsSchedule {
  state: SrsState;
  intervalDays: number;
  ease: number;
  repetitions: number;
  lapses: number;
  dueAt: Date;
}

export function scheduleReview(input: { state: SrsState; intervalDays: number; ease: number; repetitions: number; lapses: number }, rating: SrsRating, now = new Date()): SrsSchedule {
  const dueAt = new Date(now);
  const next = { ...input, repetitions: input.repetitions + 1, dueAt };
  if (rating === 'again') { dueAt.setMinutes(dueAt.getMinutes() + 5); return { ...next, state: 'LEARNING', intervalDays: 0, ease: Math.max(1.3, input.ease - 0.2), lapses: input.lapses + 1 }; }
  if (rating === 'hard') { dueAt.setHours(dueAt.getHours() + 6); return { ...next, state: 'REVIEW', intervalDays: Math.max(0.25, input.intervalDays * 1.2), ease: Math.max(1.3, input.ease - 0.15) }; }
  if (rating === 'good') { const intervalDays = input.intervalDays < 1 ? 1 : input.intervalDays * input.ease; dueAt.setTime(dueAt.getTime() + intervalDays * 86400000); return { ...next, state: 'REVIEW', intervalDays, ease: input.ease }; }
  const intervalDays = input.intervalDays < 1 ? 3 : input.intervalDays * input.ease * 1.3;
  dueAt.setTime(dueAt.getTime() + intervalDays * 86400000);
  return { ...next, state: intervalDays >= 21 ? 'MASTERED' : 'REVIEW', intervalDays, ease: input.ease + 0.15 };
}
