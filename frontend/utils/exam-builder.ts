import type { ExamSectionKind, QuestionGroupType } from '~/utils/exam';

export type GroupTypeOption = { value: QuestionGroupType; label: string; part: number; hidesOptions: boolean; takesMedia: boolean; optionKeys: string[] };

/**
 * The seven shapes a TOEIC paper is built from. Each one fixes the part, how many answer
 * choices it prints, and whether the choices appear on the page at all.
 */
export const groupTypeOptions: ReadonlyArray<GroupTypeOption> = [
  { value: 'PHOTO', label: 'Part 1 · Mô tả tranh', part: 1, hidesOptions: true, takesMedia: true, optionKeys: ['A', 'B', 'C', 'D'] },
  { value: 'SHORT_RESPONSE', label: 'Part 2 · Hỏi đáp ngắn', part: 2, hidesOptions: true, takesMedia: false, optionKeys: ['A', 'B', 'C'] },
  { value: 'CONVERSATION', label: 'Part 3 · Hội thoại', part: 3, hidesOptions: false, takesMedia: true, optionKeys: ['A', 'B', 'C', 'D'] },
  { value: 'TALK', label: 'Part 4 · Bài nói', part: 4, hidesOptions: false, takesMedia: true, optionKeys: ['A', 'B', 'C', 'D'] },
  { value: 'SINGLE_SENTENCE', label: 'Part 5 · Hoàn thành câu', part: 5, hidesOptions: false, takesMedia: false, optionKeys: ['A', 'B', 'C', 'D'] },
  { value: 'TEXT_COMPLETION', label: 'Part 6 · Hoàn thành đoạn văn', part: 6, hidesOptions: false, takesMedia: false, optionKeys: ['A', 'B', 'C', 'D'] },
  { value: 'PASSAGE_SET', label: 'Part 7 · Bộ bài đọc', part: 7, hidesOptions: false, takesMedia: false, optionKeys: ['A', 'B', 'C', 'D'] }
];

export function groupTypeOption(type: QuestionGroupType): GroupTypeOption {
  return groupTypeOptions.find((option) => option.value === type) ?? groupTypeOptions[0];
}

/** Which question kind the API expects for a part, so the author never picks it by hand. */
export function questionKindForPart(part: number): 'LISTENING' | 'READING' | 'GRAMMAR' {
  if (part <= 4) return 'LISTENING';
  return part === 5 ? 'GRAMMAR' : 'READING';
}

export type ConversionRow = { section: ExamSectionKind; rawCorrect: number; scaled: number };

/**
 * Reads a pasted conversion table. One row per line as `section,raw,scaled` — the shape an
 * answer-key sheet is usually transcribed into. Errors are reported per line, never swallowed.
 */
export function parseConversionTable(text: string): { rows: ConversionRow[]; errors: string[] } {
  const rows: ConversionRow[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((line, position) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split(/[,\t;]+/).map((part) => part.trim());
    if (parts.length !== 3) { errors.push(`Dòng ${position + 1}: cần đúng ba cột section, số câu đúng, điểm.`); return; }
    const [rawSection, rawCorrect, scaled] = parts;
    const section = rawSection.toUpperCase();
    if (section !== 'LISTENING' && section !== 'READING') { errors.push(`Dòng ${position + 1}: section phải là LISTENING hoặc READING.`); return; }
    const correct = Number(rawCorrect);
    const value = Number(scaled);
    if (!Number.isInteger(correct) || correct < 0) { errors.push(`Dòng ${position + 1}: số câu đúng phải là số nguyên không âm.`); return; }
    if (!Number.isInteger(value) || value < 0 || value > 990) { errors.push(`Dòng ${position + 1}: điểm quy đổi phải nằm trong 0–990.`); return; }
    rows.push({ section, rawCorrect: correct, scaled: value });
  });

  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${row.section}:${row.rawCorrect}`;
    if (seen.has(key)) errors.push(`Trùng dòng cho ${row.section} với ${row.rawCorrect} câu đúng.`);
    seen.add(key);
  }
  return { rows, errors };
}

export function serialiseConversionTable(rows: ConversionRow[]): string {
  return rows.map((row) => `${row.section},${row.rawCorrect},${row.scaled}`).join('\n');
}
