import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { AiProviderController } from './ai-provider.controller';
import { AiProviderService } from './ai-provider.service';
import { AiService } from './ai.service';

/**
 * `AiService` is exported so any feature that needs a model — writing feedback, question
 * generation — depends on this one gateway instead of talking to a provider directly.
 */
@Module({
  imports: [AuthModule],
  controllers: [AiProviderController],
  providers: [AiProviderService, AiService],
  exports: [AiService]
})
export class AiModule {}
