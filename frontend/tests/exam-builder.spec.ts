import { describe, expect, it } from 'vitest';
import { groupTypeOption, groupTypeOptions, parseConversionTable, questionKindForPart, serialiseConversionTable } from '../utils/exam-builder';
import { scoreCaption } from '../utils/exam';

describe('group types', () => {
  it('pins each shape to its part so the author never picks a mismatched pair', () => {
    expect(groupTypeOptions.map((option) => option.part)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('knows Part 2 prints three choices while the rest print four', () => {
    expect(groupTypeOption('SHORT_RESPONSE').optionKeys).toEqual(['A', 'B', 'C']);
    expect(groupTypeOption('CONVERSATION').optionKeys).toEqual(['A', 'B', 'C', 'D']);
  });

  it('marks exactly the parts that hide their choices and the parts that print an image', () => {
    expect(groupTypeOptions.filter((option) => option.hidesOptions).map((option) => option.part)).toEqual([1, 2]);
    expect(groupTypeOptions.filter((option) => option.takesMedia).map((option) => option.part)).toEqual([1, 3, 4]);
  });

  it('derives the question kind from the part', () => {
    expect(questionKindForPart(2)).toBe('LISTENING');
    expect(questionKindForPart(5)).toBe('GRAMMAR');
    expect(questionKindForPart(7)).toBe('READING');
  });
});

describe('conversion table parsing', () => {
  it('reads a plain three-column table and ignores blanks and comments', () => {
    const { rows, errors } = parseConversionTable('# table\nLISTENING,0,5\n\nreading, 12 , 300\n');
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { section: 'LISTENING', rawCorrect: 0, scaled: 5 },
      { section: 'READING', rawCorrect: 12, scaled: 300 }
    ]);
  });

  it('reports the offending line rather than dropping it silently', () => {
    const { rows, errors } = parseConversionTable('LISTENING,0,5\nSPEAKING,1,10\nLISTENING,two,10\nLISTENING,3,2000');
    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(3);
    expect(errors[0]).toContain('Dòng 2');
    expect(errors[1]).toContain('Dòng 3');
    expect(errors[2]).toContain('Dòng 4');
  });

  it('catches a duplicated raw score, which would otherwise score results twice', () => {
    const { errors } = parseConversionTable('LISTENING,4,200\nLISTENING,4,300');
    expect(errors.some((error) => error.includes('Trùng dòng'))).toBe(true);
  });

  it('round-trips through the editor without changing meaning', () => {
    const text = 'LISTENING,0,5\nREADING,10,250';
    expect(serialiseConversionTable(parseConversionTable(text).rows)).toBe(text);
  });
});

describe('score presentation', () => {
  it('never lets an estimate read as a reported score', () => {
    expect(scoreCaption('OFFICIAL_TABLE').provisional).toBe(false);
    expect(scoreCaption('ESTIMATED').provisional).toBe(true);
    expect(scoreCaption('RAW_ONLY').provisional).toBe(true);
  });
});
