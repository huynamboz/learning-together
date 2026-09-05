import { Test } from '@nestjs/testing';
import { PrismaService } from '@/database/prisma.service';
import { PlanCode } from '@prisma/client';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  it('uses the documented lifetime price for PRO', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'order-1', amount: 1999000, currency: 'VND', status: 'PENDING' });
    const module = await Test.createTestingModule({ providers: [BillingService, { provide: PrismaService, useValue: { order: { create } } }] }).compile();
    const result = await module.get(BillingService).createOrder('user-1', { planCode: PlanCode.PRO, provider: 'mock' });
    expect(result).toMatchObject({ orderId: 'order-1', amount: 1999000, currency: 'VND' });
    expect(create).toHaveBeenCalledWith({ data: { userId: 'user-1', planCode: PlanCode.PRO, amount: 1999000, provider: 'mock' } });
  });

  it('does not create a payment order for Free', async () => {
    const create = jest.fn();
    const module = await Test.createTestingModule({ providers: [BillingService, { provide: PrismaService, useValue: { order: { create } } }] }).compile();
    await expect(module.get(BillingService).createOrder('user-1', { planCode: PlanCode.FREE, provider: 'mock' })).rejects.toMatchObject({ code: 'PLAN_NOT_PURCHASABLE' });
    expect(create).not.toHaveBeenCalled();
  });
});
