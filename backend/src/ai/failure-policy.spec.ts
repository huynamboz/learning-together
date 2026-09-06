import { backoffMs, classifyHttpFailure, classifyTransportFailure, selectionOrder } from './failure-policy';

describe('what a failed provider call means', () => {
  it.each([408, 409, 425, 429, 500, 502, 503, 504])('retries the same provider on a transient %p', (status) => {
    expect(classifyHttpFailure(status)).toBe('retry');
  });

  it.each([401, 403, 404, 402, 451])('moves to the next provider when %p points at this provider', (status) => {
    expect(classifyHttpFailure(status)).toBe('failover');
  });

  it.each([400, 422])('stops entirely on %p, because our own payload is what is wrong', (status) => {
    expect(classifyHttpFailure(status)).toBe('fatal');
  });

  it('treats a dropped connection as worth another attempt', () => {
    expect(classifyTransportFailure()).toBe('retry');
  });
});

describe('provider selection', () => {
  const provider = (id: string, priority: number, enabled = true) => ({ id, priority, enabled });

  it('tries providers in priority order', () => {
    expect(selectionOrder([provider('c', 3), provider('a', 1), provider('b', 2)]).map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('skips disabled providers so a paused key is not tried', () => {
    expect(selectionOrder([provider('a', 1, false), provider('b', 2)]).map((p) => p.id)).toEqual(['b']);
  });

  it('breaks ties deterministically so two runs behave the same', () => {
    expect(selectionOrder([provider('b', 1), provider('a', 1)]).map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('returns nothing when every provider is off', () => {
    expect(selectionOrder([provider('a', 1, false)])).toEqual([]);
  });
});

describe('backoff', () => {
  it('grows with each attempt but never past the ceiling', () => {
    expect(backoffMs(0)).toBe(250);
    expect(backoffMs(1)).toBe(500);
    expect(backoffMs(2)).toBe(1000);
    expect(backoffMs(20)).toBe(4000);
  });
});
