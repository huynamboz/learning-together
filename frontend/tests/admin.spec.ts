import { describe, expect, it } from 'vitest';
import { adminSections, formatBytes, hasAdminAccess, pendingWork, sumCounts, type AdminOverview } from '../utils/admin';
import { nextToastStack, toastDefaults, toastMaxVisible } from '../composables/useToast';

const overview = (partial: Partial<AdminOverview>): AdminOverview => ({
  users: {}, content: {}, media: {}, imports: {}, writing: {}, reports: {}, orders: {}, recentAudit: [], ...partial
});

describe('admin access', () => {
  it('opens the console for any operations role', () => {
    expect(hasAdminAccess(['ADMIN'])).toBe(true);
    expect(hasAdminAccess(['CONTENT_EDITOR'])).toBe(true);
    expect(hasAdminAccess(['MODERATOR'])).toBe(true);
  });

  it('keeps learners and empty role sets out', () => {
    expect(hasAdminAccess(['LEARNER'])).toBe(false);
    expect(hasAdminAccess([])).toBe(false);
    expect(hasAdminAccess(undefined)).toBe(false);
  });
});

describe('pending work', () => {
  it('reports nothing before the overview loads', () => {
    expect(pendingWork(null)).toEqual([]);
  });

  it('hides groups that have no waiting work', () => {
    const result = pendingWork(overview({ writing: { GRADING: 2, GRADED: 9 }, content: { PUBLISHED: 3 } }));
    expect(result.map((item) => item.key)).toEqual(['writing']);
    expect(result[0].count).toBe(2);
  });

  it('puts the biggest backlog first and folds media failures into one row', () => {
    const result = pendingWork(overview({
      writing: { GRADING: 1 },
      content: { DRAFT: 4 },
      media: { PENDING: 2, FAILED: 3 }
    }));
    expect(result.map((item) => [item.key, item.count])).toEqual([['media', 5], ['content', 4], ['writing', 1]]);
  });
});

describe('overview helpers', () => {
  it('sums status buckets and tolerates missing groups', () => {
    expect(sumCounts({ ACTIVE: 3, SUSPENDED: 1 })).toBe(4);
    expect(sumCounts(undefined)).toBe(0);
  });

  it('formats byte sizes across the megabyte boundary', () => {
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});

describe('console navigation', () => {
  it('routes every section under /admin with a unique key', () => {
    expect(adminSections.every((section) => section.to.startsWith('/admin'))).toBe(true);
    expect(new Set(adminSections.map((section) => section.key)).size).toBe(adminSections.length);
  });
});

describe('toast stack', () => {
  const toast = (id: number) => ({ id, tone: 'info' as const, title: `t${id}`, duration: 1000 });

  it('appends newest at the end so it renders below the older ones', () => {
    expect(nextToastStack([toast(1)], toast(2)).map((item) => item.id)).toEqual([1, 2]);
  });

  it('drops the oldest once the stack is full instead of growing without bound', () => {
    const full = [toast(1), toast(2), toast(3), toast(4)];
    expect(nextToastStack(full, toast(5)).map((item) => item.id)).toEqual([2, 3, 4, 5]);
  });

  it('gives errors a longer read than successes', () => {
    expect(toastDefaults.error).toBeGreaterThan(toastDefaults.success);
    expect(toastMaxVisible).toBeGreaterThan(0);
  });
});
