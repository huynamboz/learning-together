export type VocabularyWord = {
  id: string;
  lemma: string;
  pronunciation?: string | null;
  partOfSpeech?: string | null;
  meanings?: unknown;
  examples?: unknown;
};

/** Meanings and examples are author JSON: read the first usable entry, never assume a shape. */
function firstField(value: unknown, key: string): string {
  if (!Array.isArray(value)) return '';
  for (const entry of value) {
    if (entry && typeof entry === 'object') {
      const field = (entry as Record<string, unknown>)[key];
      if (typeof field === 'string' && field.trim()) return field;
    }
  }
  return '';
}

export function meaningOf(word: VocabularyWord): string {
  return firstField(word.meanings, 'vi') || firstField(word.meanings, 'en');
}

export function exampleOf(word: VocabularyWord): string {
  return firstField(word.examples, 'en') || firstField(word.examples, 'vi');
}

export const srsRatings = [
  { value: 'AGAIN', label: 'Lại', detail: 'Gặp lại ngay', tone: 'blush' },
  { value: 'HARD', label: 'Khó', detail: 'Vài giờ nữa', tone: 'sun' },
  { value: 'GOOD', label: 'Ổn', detail: 'Khoảng một ngày', tone: 'mint' },
  { value: 'EASY', label: 'Dễ', detail: 'Giãn vài ngày', tone: 'azure' }
] as const;

export type SrsRating = (typeof srsRatings)[number]['value'];
