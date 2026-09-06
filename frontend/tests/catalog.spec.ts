import { describe, expect, it } from 'vitest';
import { availableParts, filterByPart, formatDuration, jsonText, lessonMeta, toLessonSummary, type CatalogItem } from '../utils/catalog';
import { exampleOf, meaningOf } from '../utils/vocabulary';

const item = (partial: Partial<CatalogItem> = {}): CatalogItem => ({
  id: 'c1', type: 'LISTENING', title: 'Part 1 · Office scene', slug: 'part-1-office-scene', part: 1, level: 2, payload: {}, ...partial
});

describe('lesson summary', () => {
  it('reads the richest description the payload offers', () => {
    expect(toLessonSummary(item({ payload: { summary: 'Tóm tắt' } })).summary).toBe('Tóm tắt');
    expect(toLessonSummary(item({ payload: { instruction: 'Viết một câu' } })).summary).toBe('Viết một câu');
    expect(toLessonSummary(item({ payload: { transcript: 'A group of people…' } })).summary).toBe('A group of people…');
  });

  it('survives a payload with the wrong shapes', () => {
    const lesson = toLessonSummary(item({ payload: { summary: 42, durationSec: 'long', tags: ['a', 7, 'b'], mediaAssetId: null } }));
    expect(lesson.summary).toBe('');
    expect(lesson.durationSec).toBeNull();
    expect(lesson.mediaAssetId).toBeNull();
    expect(lesson.tags).toEqual(['a', 'b']);
  });

  it('prefers the column values over payload duplicates', () => {
    const lesson = toLessonSummary(item({ part: 3, level: 4, payload: { part: 9, level: 9 } }));
    expect(lesson.part).toBe(3);
    expect(lesson.level).toBe(4);
  });
});

describe('catalog meta', () => {
  it('formats duration as minutes and seconds, and drops empty values', () => {
    expect(formatDuration(504)).toBe('8:24');
    expect(formatDuration(36)).toBe('0:36');
    expect(formatDuration(0)).toBe('');
    expect(formatDuration(null)).toBe('');
  });

  it('builds chips from whatever the lesson actually has', () => {
    expect(lessonMeta(toLessonSummary(item({ part: 2, level: null, payload: { durationSec: 18 } })))).toEqual(['Part 2', '0:18']);
  });
});

describe('part filter', () => {
  const lessons = [item({ id: 'a', part: 2 }), item({ id: 'b', part: 1 }), item({ id: 'c', part: null })].map(toLessonSummary);

  it('lists the parts present, ascending, ignoring lessons without one', () => {
    expect(availableParts(lessons)).toEqual([1, 2]);
  });

  it('returns everything for "all" and only the match otherwise', () => {
    expect(filterByPart(lessons, 'all')).toHaveLength(3);
    expect(filterByPart(lessons, 2).map((lesson) => lesson.id)).toEqual(['a']);
  });
});

describe('json text nodes', () => {
  it('reads prompt and option labels, not raw strings', () => {
    expect(jsonText({ text: 'On Monday' })).toBe('On Monday');
    expect(jsonText('On Monday')).toBe('');
    expect(jsonText(null)).toBe('');
    expect(jsonText({ label: 'On Monday' })).toBe('');
  });
});

describe('vocabulary entries', () => {
  it('picks the first usable meaning and example', () => {
    const word = { id: 'w1', lemma: 'allocate', meanings: [{}, { vi: 'phân bổ' }], examples: [{ en: 'We allocate time.' }] };
    expect(meaningOf(word)).toBe('phân bổ');
    expect(exampleOf(word)).toBe('We allocate time.');
  });

  it('returns empty strings rather than throwing on unexpected shapes', () => {
    const word = { id: 'w2', lemma: 'deadline', meanings: 'phân bổ', examples: null };
    expect(meaningOf(word)).toBe('');
    expect(exampleOf(word)).toBe('');
  });
});
