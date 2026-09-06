export type ExamSectionKind = 'LISTENING' | 'READING';
export type ScoreSource = 'OFFICIAL_TABLE' | 'ESTIMATED' | 'RAW_ONLY';
export type QuestionGroupType =
  | 'PHOTO' | 'SHORT_RESPONSE' | 'CONVERSATION' | 'TALK'
  | 'SINGLE_SENTENCE' | 'TEXT_COMPLETION' | 'PASSAGE_SET';

export type ExamSection = { id: string; kind: ExamSectionKind; label: string; durationMin: number; sortOrder: number };

export type GroupPassage = { label?: string; body?: string };

export type QuestionGroup = {
  id: string;
  type: QuestionGroupType;
  part: number;
  sortOrder: number;
  stimulus: Record<string, unknown>;
  transcript: string | null;
  audioAssetId: string | null;
  audioStartSec: number | null;
  audioEndSec: number | null;
  media?: Array<{ assetId: string; role: string; caption: string | null; sortOrder: number }>;
};

export type ExamResultPayload = {
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number | null;
  listeningCorrect: number | null;
  readingCorrect: number | null;
  listeningScaled: number | null;
  readingScaled: number | null;
  scoreSource: ScoreSource;
};

const GROUP_LABEL: Record<QuestionGroupType, string> = {
  PHOTO: 'Mô tả tranh',
  SHORT_RESPONSE: 'Hỏi đáp ngắn',
  CONVERSATION: 'Hội thoại',
  TALK: 'Bài nói ngắn',
  SINGLE_SENTENCE: 'Hoàn thành câu',
  TEXT_COMPLETION: 'Hoàn thành đoạn văn',
  PASSAGE_SET: 'Bài đọc'
};

export function groupLabel(type: QuestionGroupType | undefined): string {
  return type ? GROUP_LABEL[type] ?? '' : '';
}

export function sectionLabel(kind: ExamSectionKind): string {
  return kind === 'LISTENING' ? 'Nghe' : 'Đọc';
}

/** Directions and passages are author JSON, so every field is read defensively. */
export function directionsOf(group: QuestionGroup | undefined): string {
  const value = group?.stimulus?.directions;
  return typeof value === 'string' ? value : '';
}

export function photoCaptionOf(group: QuestionGroup | undefined): string {
  const value = group?.stimulus?.photoCaption;
  return typeof value === 'string' ? value : '';
}

export function passagesOf(group: QuestionGroup | undefined): GroupPassage[] {
  const value = group?.stimulus?.passages;
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      label: typeof entry.label === 'string' ? entry.label : undefined,
      body: typeof entry.body === 'string' ? entry.body : undefined
    }))
    .filter((passage) => Boolean(passage.body));
}

/**
 * How a score may be presented. An estimate is never allowed to look like a reported score,
 * so the caller gets both the wording and the fact that it is provisional.
 */
export function scoreCaption(source: ScoreSource): { note: string; provisional: boolean } {
  if (source === 'OFFICIAL_TABLE') return { note: 'Quy đổi theo bảng điểm của chính đề này.', provisional: false };
  if (source === 'ESTIMATED') return { note: 'Điểm ước lượng — đề này chưa có bảng quy đổi riêng.', provisional: true };
  return { note: 'Đề chưa đủ dữ liệu để quy đổi; chỉ hiển thị số câu đúng.', provisional: true };
}
