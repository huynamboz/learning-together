import { Controller, Get, Param } from '@nestjs/common';
import { VocabularySetService } from './vocabulary-set.service';

/**
 * Public set catalog. Kept apart from VocabularyController because that one guards
 * every route with JWT: browsing what a set contains does not require an account,
 * only reviewing it does.
 */
@Controller('vocabulary/sets')
export class VocabularySetController {
  constructor(private readonly service: VocabularySetService) {}

  @Get()
  list() { return this.service.list(); }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) { return this.service.bySlug(slug); }
}
