import { Injectable } from '@nestjs/common';
import { OrderStatus, PlanCode } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { ApiError } from '@/common/http/api-error';
import { CreateOrderDto } from './billing.dto';

const planPrices: Record<PlanCode, number> = { FREE: 0, PRO: 1999000, PREMIUM: 2499000 };

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (dto.planCode === PlanCode.FREE) throw new ApiError('PLAN_NOT_PURCHASABLE', 'Gói Free không cần thanh toán.', {}, 422);
    const order = await this.prisma.order.create({ data: { userId, planCode: dto.planCode, amount: planPrices[dto.planCode], provider: dto.provider.trim().toLowerCase() } });
    return { orderId: order.id, amount: order.amount, currency: order.currency, status: order.status, next: 'redirect_to_provider' };
  }

  orders(userId: string) { return this.prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }); }

  async applyPaidOrder(orderId: string, providerRef: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new ApiError('ORDER_NOT_FOUND', 'Không tìm thấy đơn hàng.', {}, 404);
      if (order.status === OrderStatus.PAID) return order;
      const plan = await tx.plan.upsert({ where: { code: order.planCode }, update: {}, create: { code: order.planCode, displayName: order.planCode } });
      await tx.entitlement.create({ data: { userId: order.userId, planId: plan.id } });
      return tx.order.update({ where: { id: orderId }, data: { status: OrderStatus.PAID, providerRef, paidAt: new Date() } });
    });
  }
}
