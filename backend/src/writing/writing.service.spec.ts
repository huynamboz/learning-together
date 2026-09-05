import { countWords } from './writing.service';

describe('writing service helpers', () => {
  it('counts words consistently for the UI limit', () => {
    expect(countWords('  Write   one clear sentence. ')).toBe(4);
    expect(countWords('')).toBe(0);
  });
});
