import { ExamSectionKind, QuestionGroupType, QuestionKind } from '@prisma/client';

export type ImportOption = { key: string; text: string };

export type ImportQuestion = {
  numberInTest?: number;
  prompt: string;
  answerKey: string;
  explanation?: string;
  optionsHidden?: boolean;
  level?: number;
  options: ImportOption[];
};

export type ImportGroup = {
  type: QuestionGroupType;
  part: number;
  stimulus?: Record<string, unknown>;
  transcript?: string;
  /** Media are named by the file already in the library, not by id, so a manifest stays portable. */
  audio?: string;
  audioStartSec?: number;
  audioEndSec?: number;
  images?: string[];
  questions: ImportQuestion[];
};

export type ImportSection = {
  kind: ExamSectionKind;
  label: string;
  durationMin: number;
  groups: ImportGroup[];
};

export type ImportConversion = { section: ExamSectionKind; rawCorrect: number; scaled: number };

export type ImportPaper = {
  sections: ImportSection[];
  conversions?: ImportConversion[];
};

export type ImportIssue = { path: string; message: string };

export type ImportPlan = {
  issues: ImportIssue[];
  counts: { sections: number; groups: number; questions: number; images: number; conversions: number };
  /** Every file name the manifest asks for, so the caller can resolve them in one query. */
  mediaNames: string[];
};

/** Which parts may carry an image, mirroring what the printed paper actually shows. */
const MEDIA_PARTS = new Set([1, 3, 4]);
const GROUP_PARTS: Record<QuestionGroupType, number> = {
  PHOTO: 1,
  SHORT_RESPONSE: 2,
  CONVERSATION: 3,
  TALK: 4,
  SINGLE_SENTENCE: 5,
  TEXT_COMPLETION: 6,
  PASSAGE_SET: 7
};

export function questionKindForPart(part: number): QuestionKind {
  if (part <= 4) return QuestionKind.LISTENING;
  return part === 5 ? QuestionKind.GRAMMAR : QuestionKind.READING;
}

/**
 * Reads a whole paper before anything is written. Every problem is reported with the path that
 * caused it, so a 200-question manifest comes back as a list to fix rather than one failure.
 */
export function planImport(paper: ImportPaper): ImportPlan {
  const issues: ImportIssue[] = [];
  const mediaNames = new Set<string>();
  const seenNumbers = new Map<number, string>();
  let groups = 0;
  let questions = 0;
  let images = 0;

  if (!Array.isArray(paper.sections) || !paper.sections.length) {
    issues.push({ path: 'sections', message: 'Cần ít nhất một section.' });
  }

  (paper.sections ?? []).forEach((section, sectionIndex) => {
    const sectionPath = `sections[${sectionIndex}]`;
    if (section.kind !== ExamSectionKind.LISTENING && section.kind !== ExamSectionKind.READING) {
      issues.push({ path: `${sectionPath}.kind`, message: 'kind phải là LISTENING hoặc READING.' });
    }
    if (!section.label?.trim()) issues.push({ path: `${sectionPath}.label`, message: 'Section cần nhãn.' });
    if (!Number.isInteger(section.durationMin) || section.durationMin < 1) {
      issues.push({ path: `${sectionPath}.durationMin`, message: 'durationMin phải là số phút dương.' });
    }
    if (!Array.isArray(section.groups) || !section.groups.length) {
      issues.push({ path: `${sectionPath}.groups`, message: 'Section cần ít nhất một nhóm.' });
    }

    (section.groups ?? []).forEach((group, groupIndex) => {
      const groupPath = `${sectionPath}.groups[${groupIndex}]`;
      groups += 1;
      const expectedPart = GROUP_PARTS[group.type];
      if (expectedPart === undefined) {
        issues.push({ path: `${groupPath}.type`, message: 'type không phải một dạng nhóm hợp lệ.' });
      } else if (group.part !== expectedPart) {
        issues.push({ path: `${groupPath}.part`, message: `Dạng ${group.type} thuộc Part ${expectedPart}, không phải ${group.part}.` });
      }
      if (group.audio) mediaNames.add(group.audio);
      if (group.images?.length) {
        if (!MEDIA_PARTS.has(group.part)) {
          issues.push({ path: `${groupPath}.images`, message: 'Chỉ Part 1, 3 và 4 nhận ảnh.' });
        }
        group.images.forEach((name) => mediaNames.add(name));
        images += group.images.length;
      }
      if (group.audioStartSec !== undefined && group.audioEndSec !== undefined && group.audioEndSec <= group.audioStartSec) {
        issues.push({ path: `${groupPath}.audioEndSec`, message: 'Mốc kết thúc phải lớn hơn mốc bắt đầu.' });
      }
      if (!Array.isArray(group.questions) || !group.questions.length) {
        issues.push({ path: `${groupPath}.questions`, message: 'Nhóm cần ít nhất một câu hỏi.' });
      }

      (group.questions ?? []).forEach((question, questionIndex) => {
        const questionPath = `${groupPath}.questions[${questionIndex}]`;
        questions += 1;
        if (!question.prompt?.trim()) issues.push({ path: `${questionPath}.prompt`, message: 'Câu hỏi cần đề bài.' });
        if (!Array.isArray(question.options) || question.options.length < 2) {
          issues.push({ path: `${questionPath}.options`, message: 'Câu hỏi cần ít nhất hai lựa chọn.' });
          return;
        }
        const keys = question.options.map((option) => option.key?.trim().toUpperCase() ?? '');
        if (keys.some((key) => !key)) issues.push({ path: `${questionPath}.options`, message: 'Mỗi lựa chọn cần một ký hiệu.' });
        if (new Set(keys).size !== keys.length) issues.push({ path: `${questionPath}.options`, message: 'Các lựa chọn trùng ký hiệu.' });
        if (question.options.some((option) => !option.text?.trim())) {
          issues.push({ path: `${questionPath}.options`, message: 'Mỗi lựa chọn cần nội dung.' });
        }
        const answer = question.answerKey?.trim().toUpperCase() ?? '';
        if (!keys.includes(answer)) issues.push({ path: `${questionPath}.answerKey`, message: 'Đáp án đúng không nằm trong danh sách lựa chọn.' });

        if (question.numberInTest !== undefined) {
          const clash = seenNumbers.get(question.numberInTest);
          if (clash) issues.push({ path: `${questionPath}.numberInTest`, message: `Số câu ${question.numberInTest} đã dùng ở ${clash}.` });
          else seenNumbers.set(question.numberInTest, questionPath);
        }
      });
    });
  });

  const conversions = paper.conversions ?? [];
  const seenConversions = new Set<string>();
  conversions.forEach((row, index) => {
    const path = `conversions[${index}]`;
    if (row.section !== ExamSectionKind.LISTENING && row.section !== ExamSectionKind.READING) {
      issues.push({ path: `${path}.section`, message: 'section phải là LISTENING hoặc READING.' });
    }
    if (!Number.isInteger(row.rawCorrect) || row.rawCorrect < 0) issues.push({ path: `${path}.rawCorrect`, message: 'rawCorrect phải là số nguyên không âm.' });
    if (!Number.isInteger(row.scaled) || row.scaled < 0 || row.scaled > 990) issues.push({ path: `${path}.scaled`, message: 'scaled phải nằm trong 0–990.' });
    const key = `${row.section}:${row.rawCorrect}`;
    if (seenConversions.has(key)) issues.push({ path, message: 'Trùng section và rawCorrect với một dòng trước.' });
    seenConversions.add(key);
  });

  return {
    issues,
    counts: { sections: paper.sections?.length ?? 0, groups, questions, images, conversions: conversions.length },
    mediaNames: [...mediaNames]
  };
}

/** Names the manifest asked for that the library does not hold as a usable asset. */
export function missingMedia(requested: string[], available: Map<string, unknown>): ImportIssue[] {
  return requested
    .filter((name) => !available.has(name))
    .map((name) => ({ path: `media["${name}"]`, message: 'Chưa có asset READY và công khai nào mang tên tệp này.' }));
}
