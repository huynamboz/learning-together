import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { RoleName } from '@prisma/client';
import type { Request } from 'express';
import type { AuthenticatedRequest } from '@/access/roles.guard';
import type { AccessTokenPayload } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearer(request);
    if (!token) throw new UnauthorizedException('Bạn cần đăng nhập.');
    try {
      const payload = this.jwt.verify<AccessTokenPayload>(token, { secret: this.config.getOrThrow<string>('jwt.accessSecret') });
      if (payload.typ !== 'access' || !payload.sub) throw new Error('Invalid token type');
      request.user = { id: payload.sub, roles: payload.roles as RoleName[] };
      return true;
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập không còn hợp lệ.');
    }
  }

  private extractBearer(request: Request): string | undefined {
    const authorization = request.header('authorization');
    return authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  }
}
