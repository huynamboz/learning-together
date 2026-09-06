import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest, RolesGuard } from '@/access/roles.guard';
import { Roles } from '@/access/roles.decorator';
import { CreateAiProviderDto, ReorderAiProvidersDto, UpdateAiProviderDto } from './ai-provider.dto';
import { AiProviderService } from './ai-provider.service';
import { AiService } from './ai.service';

/**
 * Provider credentials are third-party billing secrets, so this sits behind ADMIN and above —
 * a content editor never needs it. No response on this controller carries a key.
 */
@Controller('admin/ai-providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
export class AiProviderController {
  constructor(private readonly service: AiProviderService, private readonly ai: AiService) {}

  @Get()
  async list() {
    return { providers: await this.service.list(), encryptionReady: this.service.encryptionReady() };
  }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateAiProviderDto) {
    return this.service.create(request.user!.id, dto);
  }

  @Patch('order')
  reorder(@Req() request: AuthenticatedRequest, @Body() dto: ReorderAiProvidersDto) {
    return this.service.reorder(request.user!.id, dto);
  }

  @Patch(':id')
  update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateAiProviderDto) {
    return this.service.update(id, request.user!.id, dto);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.remove(id, request.user!.id);
  }

  /** Spends one tiny completion so an operator can tell a working key from a typo. */
  @Post(':id/test')
  async test(@Param('id') id: string) {
    return { attempt: await this.ai.probe(id) };
  }
}
