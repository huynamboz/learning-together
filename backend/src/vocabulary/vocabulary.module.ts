import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';
import { VocabularySetController } from './vocabulary-set.controller';
import { VocabularySetService } from './vocabulary-set.service';

@Module({
  imports: [AuthModule],
  controllers: [VocabularySetController, VocabularyController],
  providers: [VocabularyService, VocabularySetService]
})
export class VocabularyModule {}
