import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PlanCode, Prisma, RoleName } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { RegisterDto } from './auth.dto';

export interface AccessTokenPayload {
  sub: string;
  roles: string[];
  typ: 'access';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async verifyPassword(email: string, password: string): Promise<{ id: string; email: string; roles: string[] }> {
    const identity = await this.prisma.authIdentity.findFirst({
      where: { provider: 'PASSWORD', user: { email: email.toLowerCase(), status: 'ACTIVE' } },
      include: { user: { include: { roles: { include: { role: true } } } } }
    });
    if (!identity?.passwordHash || !(await argon2.verify(identity.passwordHash, password))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }
    return {
      id: identity.user.id,
      email: identity.user.email,
      roles: identity.user.roles.map(({ role }) => role.name)
    };
  }

  async register(dto: RegisterDto): Promise<{ id: string; email: string; roles: string[] }> {
    const email = dto.email.toLowerCase();
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({ data: { email, displayName: dto.displayName.trim(), identities: { create: { provider: 'PASSWORD', providerAccountId: email, passwordHash: await this.hashPassword(dto.password) } } } });
        const role = await tx.role.upsert({ where: { name: RoleName.LEARNER }, update: {}, create: { name: RoleName.LEARNER } });
        await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
        const plan = await tx.plan.upsert({ where: { code: PlanCode.FREE }, update: {}, create: { code: PlanCode.FREE, displayName: 'Free' } });
        await tx.entitlement.create({ data: { userId: user.id, planId: plan.id } });
        return { id: user.id, email: user.email, roles: [RoleName.LEARNER] };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Email đã được sử dụng.');
      throw error;
    }
  }

  async login(email: string, password: string, deviceId?: string) {
    const user = await this.verifyPassword(email, password);
    return this.createSession(user, deviceId);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { refreshTokenHash: tokenHash }, include: { user: { include: { roles: { include: { role: true } } } } } });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now() || session.user.status !== 'ACTIVE') throw new UnauthorizedException('Refresh token không còn hợp lệ.');
    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.createSession({ id: session.user.id, email: session.user.email, roles: session.user.roles.map(({ role }) => role.name) }, session.deviceId ?? undefined);
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.session.updateMany({ where: { refreshTokenHash: this.hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
  }

  private async createSession(user: { id: string; email: string; roles: string[] }, deviceId?: string) {
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + this.config.get<number>('jwt.refreshTtlDays', 30) * 86400000);
    await this.prisma.session.create({ data: { userId: user.id, deviceId, refreshTokenHash: this.hashToken(refreshToken), expiresAt } });
    return { accessToken: this.issueAccessToken(user), refreshToken, user };
  }

  private hashToken(token: string): string { return createHash('sha256').update(token).digest('hex'); }

  issueAccessToken(user: { id: string; roles: string[] }): string {
    const payload: AccessTokenPayload = { sub: user.id, roles: user.roles, typ: 'access' };
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessTtl', '15m') as JwtSignOptions['expiresIn']
    });
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }
}
