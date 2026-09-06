import { ExamSectionKind, QuestionGroupType } from '@prisma/client';
import { missingMedia, planImport, questionKindForPart, type ImportPaper } from './exam-import';

const question = (overrides: Record<string, unknown> = {}) => ({
  prompt: 'Why is the woman calling?',
  answerKey: 'B',
  options: [{ key: 'A', text: 'To cancel' }, { key: 'B', text: 'To report a fault' }],
  ...overrides
});

const paper = (overrides: Partial<ImportPaper> = {}): ImportPaper => ({
  sections: [{
    kind: ExamSectionKind.LISTENING,
    label: 'Listening',
    durationMin: 45,
    groups: [{ type: QuestionGroupType.CONVERSATION, part: 3, questions: [question()] }]
  }],
  ...overrides
}) as ImportPaper;

describe('planImport', () => {
  it('accepts a well-formed paper and counts what it would write', () => {
    const plan = planImport(paper());
    expect(plan.issues).toEqual([]);
    expect(plan.counts).toMatchObject({ sections: 1, groups: 1, questions: 1 });
  });

  it('reports every problem with the path that caused it instead of failing on the first', () => {
    const plan = planImport({
      sections: [{
        kind: ExamSectionKind.LISTENING,
        label: '',
        durationMin: 0,
        groups: [{
          type: QuestionGroupType.CONVERSATION,
          part: 3,
          questions: [question({ prompt: '', answerKey: 'D' })]
        }]
      }]
    } as ImportPaper);
    const paths = plan.issues.map((issue) => issue.path);
    expect(paths).toContain('sections[0].label');
    expect(paths).toContain('sections[0].durationMin');
    expect(paths).toContain('sections[0].groups[0].questions[0].prompt');
    expect(paths).toContain('sections[0].groups[0].questions[0].answerKey');
  });

  it('refuses a group whose part does not match its own shape', () => {
    const plan = planImport(paper({
      sections: [{ kind: ExamSectionKind.READING, label: 'Reading', durationMin: 75, groups: [{ type: QuestionGroupType.PASSAGE_SET, part: 5, questions: [question()] }] }]
    } as Partial<ImportPaper>));
    expect(plan.issues.some((issue) => issue.path === 'sections[0].groups[0].part')).toBe(true);
  });

  it('refuses an image on a part that never prints one', () => {
    const plan = planImport(paper({
      sections: [{ kind: ExamSectionKind.READING, label: 'Reading', durationMin: 75, groups: [{ type: QuestionGroupType.SINGLE_SENTENCE, part: 5, images: ['a.png'], questions: [question()] }] }]
    } as Partial<ImportPaper>));
    expect(plan.issues.some((issue) => issue.path === 'sections[0].groups[0].images')).toBe(true);
  });

  it('catches two questions claiming the same item number across the whole paper', () => {
    const plan = planImport(paper({
      sections: [{
        kind: ExamSectionKind.LISTENING,
        label: 'Listening',
        durationMin: 45,
        groups: [
          { type: QuestionGroupType.CONVERSATION, part: 3, questions: [question({ numberInTest: 32 })] },
          { type: QuestionGroupType.TALK, part: 4, questions: [question({ numberInTest: 32 })] }
        ]
      }]
    } as Partial<ImportPaper>));
    expect(plan.issues.some((issue) => issue.message.includes('Số câu 32'))).toBe(true);
  });

  it('collects every media file the manifest asks for, without duplicates', () => {
    const plan = planImport(paper({
      sections: [{
        kind: ExamSectionKind.LISTENING,
        label: 'Listening',
        durationMin: 45,
        groups: [
          { type: QuestionGroupType.PHOTO, part: 1, audio: 'part1.mp3', images: ['p1.png'], questions: [question()] },
          { type: QuestionGroupType.CONVERSATION, part: 3, audio: 'part1.mp3', questions: [question()] }
        ]
      }]
    } as Partial<ImportPaper>));
    expect(plan.mediaNames.sort()).toEqual(['p1.png', 'part1.mp3']);
  });

  it('rejects an audio range that ends before it starts', () => {
    const plan = planImport(paper({
      sections: [{ kind: ExamSectionKind.LISTENING, label: 'Listening', durationMin: 45, groups: [{ type: QuestionGroupType.TALK, part: 4, audioStartSec: 120, audioEndSec: 60, questions: [question()] }] }]
    } as Partial<ImportPaper>));
    expect(plan.issues.some((issue) => issue.path === 'sections[0].groups[0].audioEndSec')).toBe(true);
  });

  it('checks the conversion rows travelling with the paper', () => {
    const plan = planImport(paper({
      conversions: [
        { section: ExamSectionKind.LISTENING, rawCorrect: 4, scaled: 200 },
        { section: ExamSectionKind.LISTENING, rawCorrect: 4, scaled: 300 }
      ]
    }));
    expect(plan.issues.some((issue) => issue.path === 'conversions[1]')).toBe(true);
  });
});

describe('missingMedia', () => {
  it('names the files the library cannot supply', () => {
    const available = new Map([['have.png', {}]]);
    expect(missingMedia(['have.png', 'gone.mp3'], available)).toEqual([
      { path: 'media["gone.mp3"]', message: 'Chưa có asset READY và công khai nào mang tên tệp này.' }
    ]);
  });
});

describe('questionKindForPart', () => {
  it('maps a part to the kind the rest of the system expects', () => {
    expect(questionKindForPart(1)).toBe('LISTENING');
    expect(questionKindForPart(5)).toBe('GRAMMAR');
    expect(questionKindForPart(7)).toBe('READING');
  });
});
