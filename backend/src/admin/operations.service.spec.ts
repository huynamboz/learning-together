import { UserStatus } from '@prisma/client';
import { OperationsService } from './operations.service';

describe('OperationsService', () => {
  it('normalizes overview grouped counts', async () => {
    const grouped = [{ status: UserStatus.ACTIVE, _count: { _all: 3 } }];
    const groupBy = jest.fn();
    const prisma = { $transaction: jest.fn().mockResolvedValue([grouped, [], [], [], [], [], [], []]), user: { groupBy }, contentItem: { groupBy }, mediaAsset: { groupBy }, importBatch: { groupBy }, writingSubmission: { groupBy }, report: { groupBy }, order: { groupBy }, auditLog: { findMany: jest.fn() } } as never;
    await expect(new OperationsService(prisma).overview()).resolves.toMatchObject({ users: { ACTIVE: 3 }, content: {} });
  });

  it('maps roles and plan in admin user rows', async () => {
    const prisma = { user: { findMany: jest.fn().mockResolvedValue([{ id: 'u1', email: 'a@example.com', displayName: 'A', status: UserStatus.ACTIVE, createdAt: new Date(), roles: [{ role: { name: 'LEARNER' } }], entitlements: [{ plan: { code: 'FREE' } }] }]) } } as never;
    await expect(new OperationsService(prisma).users()).resolves.toMatchObject([{ email: 'a@example.com', roles: ['LEARNER'], plan: 'FREE' }]);
  });
});
