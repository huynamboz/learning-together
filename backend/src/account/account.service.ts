import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuthService } from '@/auth/auth.service';
import { UpdatePasswordDto, UpdateProfileDto } from './account.dto';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, displayName: true, avatarAssetId: true, status: true, timezone: true, locale: true, createdAt: true, roles: { include: { role: true } }, entitlements: { where: { status: 'ACTIVE' }, include: { plan: true }, orderBy: { startsAt: 'desc' }, take: 1 } } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    return { ...user, roles: user.roles.map(({ role }) => role.name), plan: user.entitlements[0]?.plan.code ?? 'FREE' };
  }

  updateProfile(userId: string, dto: UpdateProfileDto) { return this.prisma.user.update({ where: { id: userId }, data: { displayName: dto.displayName.trim() }, select: { id: true, email: true, displayName: true, avatarAssetId: true } }); }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    await this.auth.verifyPassword(user.email, dto.currentPassword);
    const passwordHash = await this.auth.hashPassword(dto.newPassword);
    await this.prisma.authIdentity.updateMany({ where: { userId, provider: 'PASSWORD' }, data: { passwordHash } });
    await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  devices(userId: string) { return this.prisma.device.findMany({ where: { userId, revokedAt: null }, orderBy: { lastSeenAt: 'desc' } }); }

  async removeDevice(userId: string, deviceId: string) { const result = await this.prisma.device.updateMany({ where: { id: deviceId, userId, revokedAt: null }, data: { revokedAt: new Date() } }); if (!result.count) throw new NotFoundException('Không tìm thấy thiết bị.'); return { ok: true }; }
}
