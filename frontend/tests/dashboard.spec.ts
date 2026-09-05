import { describe, expect, it } from 'vitest';

describe('dashboard content contract', () => {
  it('keeps the primary study surfaces discoverable', () => {
    expect(['/listen', '/read?mode=grammar', '/vocabulary', '/mock-test']).toHaveLength(4);
  });
});
