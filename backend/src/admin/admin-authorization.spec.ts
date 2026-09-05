import { GUARDS_METADATA } from '@nestjs/common/constants';
import { RolesGuard } from '@/access/roles.guard';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { ContentAdminController } from './content.controller';
import { ImportController } from './import.controller';
import { OperationsController } from './operations.controller';

describe('admin authorization metadata', () => {
  it.each([ContentAdminController, ImportController, OperationsController])('runs JWT authentication before role authorization for %p', (controller) => {
    expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([JwtAuthGuard, RolesGuard]);
  });
});
