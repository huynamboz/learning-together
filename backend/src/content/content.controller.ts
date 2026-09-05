import { ContentType } from '@prisma/client';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly service: ContentService) {}

  @Get()
  list(@Query('type') type?: ContentType, @Query('part') part?: string, @Query('level') level?: string, @Query('search') search = '') {
    return this.service.list({ type, part: part ? Number(part) : undefined, level: level ? Number(level) : undefined, search });
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) { return this.service.bySlug(slug); }
}
