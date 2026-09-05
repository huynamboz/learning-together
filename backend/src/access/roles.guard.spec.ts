import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function context(user?: { id: string; roles: RoleName[] }): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ user }) })
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows routes without role metadata', () => {
    const reflector = { getAllAndOverride: () => undefined } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context())).toBe(true);
  });

  it('requires at least one matching role', () => {
    const reflector = { getAllAndOverride: () => [RoleName.ADMIN] } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(context({ id: '1', roles: [RoleName.LEARNER] }))).toBe(false);
    expect(guard.canActivate(context({ id: '1', roles: [RoleName.ADMIN] }))).toBe(true);
  });
});
