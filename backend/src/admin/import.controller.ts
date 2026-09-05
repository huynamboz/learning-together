import { RoleName } from '@prisma/client';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsObject, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest, RolesGuard } from '@/access/roles.guard';
import { Roles } from '@/access/roles.decorator';
import { ImportRow, ImportService } from './import.service';

class CreateImportDto {
  @IsString()
  @MaxLength(255)
  sourceName!: string;

  @IsString()
  @MaxLength(80)
  schema!: string;

  @IsArray()
  @IsObject({ each: true })
  rows!: ImportRow[];
}

@Controller('admin/imports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.CONTENT_EDITOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
export class ImportController {
  constructor(private readonly service: ImportService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateImportDto) { return this.service.createBatch(request.user!.id, dto.sourceName, dto.schema, dto.rows); }
}
