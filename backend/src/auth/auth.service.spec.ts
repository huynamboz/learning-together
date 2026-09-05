import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '@/database/prisma.service';

describe('AuthService', () => {
  it('hashes and verifies an Argon2id password', async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} }
      ]
    }).compile();
    const service = module.get(AuthService);
    const hash = await service.hashPassword('correct horse battery staple');
    expect(hash).not.toContain('correct horse');
    expect(hash).toMatch(/^\$argon2id\$/);
  });

  it('issues an access token with stable claims', async () => {
    const sign = jest.fn().mockReturnValue('token');
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {} },
        { provide: JwtService, useValue: { sign } },
        { provide: ConfigService, useValue: { getOrThrow: () => 'test-secret', get: () => '15m' } }
      ]
    }).compile();
    const token = module.get(AuthService).issueAccessToken({ id: 'user-1', roles: ['LEARNER'] });
    expect(token).toBe('token');
    expect(sign).toHaveBeenCalledWith({ sub: 'user-1', roles: ['LEARNER'], typ: 'access' }, { secret: 'test-secret', expiresIn: '15m' });
  });
});
