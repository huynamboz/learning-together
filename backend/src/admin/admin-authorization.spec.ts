import { GUARDS_METADATA } from '@nestjs/common/constants';
import { RoleName } from '@prisma/client';
import { ROLES_KEY } from '@/access/roles.decorator';
import { AiProviderController } from '@/ai/ai-provider.controller';
import { RolesGuard } from '@/access/roles.guard';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { ContentAdminController } from './content.controller';
import { ImportController } from './import.controller';
import { MediaAdminController } from './media.controller';
import { OperationsController } from './operations.controller';
import { WritingReviewController } from './writing-review.controller';

describe('admin authorization metadata', () => {
  it.each([ContentAdminController, ImportController, OperationsController, MediaAdminController, WritingReviewController, AiProviderController])('runs JWT authentication before role authorization for %p', (controller) => {
    expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('keeps AI provider credentials above the content-editor role', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, AiProviderController);
    expect(roles).toEqual([RoleName.ADMIN, RoleName.SUPER_ADMIN]);
    expect(roles).not.toContain(RoleName.CONTENT_EDITOR);
  });
});
