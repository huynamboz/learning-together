/**
 * How far a learner has actually got on each study surface.
 *
 * A roadmap that invents its own progress is worse than no roadmap: it tells someone they have
 * finished a stage they have not started. These are the real counters the roadmap reads, kept
 * separate from the daily dashboard because a roadmap measures a lifetime, not a day.
 */
export type SurfaceProgress = {
  listeningAnswered: number;
  readingAnswered: number;
  grammarAnswered: number;
  vocabularyReviewed: number;
  writingSubmitted: number;
  writingGraded: number;
  videoSeconds: number;
  examsCompleted: number;
  bestExamScore: number | null;
};

export type SurfaceKey = keyof SurfaceProgress;

/** Reads one counter by name, so a stage requirement can name its measure as data. */
export function surfaceValue(progress: SurfaceProgress | null, key: SurfaceKey): number {
  const value = progress?.[key];
  return typeof value === 'number' ? value : 0;
}
