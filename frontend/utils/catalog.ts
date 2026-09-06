export type ContentPayload = Record<string, unknown>;

export type CatalogItem = {
  id: string;
  type: string;
  title: string;
  slug: string;
  part?: number | null;
  level?: number | null;
  payload: ContentPayload;
};

export type LessonSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  part: number | null;
  level: number | null;
  durationSec: number | null;
  mediaAssetId: string | null;
  category: string;
  tags: string[];
};

export function textOf(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/** Question prompts and option labels are stored as `{ text: "..." }` JSON nodes. */
export function jsonText(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const text = (value as Record<string, unknown>).text;
  return typeof text === 'string' ? text : '';
}

export function numberOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function tagsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === 'string') : [];
}

/**
 * Content payloads are author-controlled JSON, so every field is read defensively:
 * a lesson with a half-filled payload still renders instead of breaking the list.
 */
export function toLessonSummary(item: CatalogItem): LessonSummary {
  const payload = item.payload ?? {};
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: textOf(payload.summary) || textOf(payload.instruction) || textOf(payload.transcript) || textOf(payload.rule),
    part: item.part ?? numberOf(payload.part),
    level: item.level ?? numberOf(payload.level),
    durationSec: numberOf(payload.durationSec),
    mediaAssetId: textOf(payload.mediaAssetId) || null,
    category: textOf(payload.category) || textOf(payload.topic) || textOf(payload.textType) || textOf(payload.promptType),
    tags: tagsOf(payload.tags)
  };
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function levelLabel(level: number | null): string {
  return level === null ? '' : `Cấp ${level}`;
}

export function partLabel(part: number | null): string {
  return part === null ? '' : `Part ${part}`;
}

/** Meta chips shown under a catalog row, with empty values dropped. */
export function lessonMeta(lesson: LessonSummary): string[] {
  return [partLabel(lesson.part), levelLabel(lesson.level), formatDuration(lesson.durationSec), lesson.category].filter(Boolean);
}

/** Parts present in a catalog, ascending — drives the filter row. */
export function availableParts(lessons: LessonSummary[]): number[] {
  return Array.from(new Set(lessons.map((lesson) => lesson.part).filter((part): part is number => part !== null))).sort((a, b) => a - b);
}

export function filterByPart(lessons: LessonSummary[], part: number | 'all'): LessonSummary[] {
  return part === 'all' ? lessons : lessons.filter((lesson) => lesson.part === part);
}
