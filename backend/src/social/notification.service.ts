import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, limit = 30) { return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: Math.min(Math.max(limit, 1), 100) }); }

  markAllRead(userId: string) { return this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } }); }

  create(userId: string, type: NotificationType, title: string, body: string, data?: Prisma.InputJsonValue) { return this.prisma.notification.create({ data: { userId, type, title, body, data } }); }
}
