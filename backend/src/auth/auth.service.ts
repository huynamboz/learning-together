import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '@/database/prisma.service';

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
