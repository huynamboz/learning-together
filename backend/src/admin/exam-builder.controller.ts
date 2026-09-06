import { RoleName } from '@prisma/client';
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthenticatedRequest, RolesGuard } from '@/access/roles.guard';
import { Roles } from '@/access/roles.decorator';
import {
  AttachGroupMediaDto,
  CreateGroupDto,
  CreateGroupQuestionDto,
  CreateMockTestDto,
  CreateSectionDto,
  ImportPaperDto,
  ReorderGroupsDto,
  ReplaceConversionsDto,
  UpdateGroupDto,
  UpdateGroupQuestionDto,
  UpdateMockTestDto,
  UpdateSectionDto
} from './exam-builder.dto';
import { ExamBuilderService } from './exam-builder.service';

@Controller('admin/exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.CONTENT_EDITOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
export class ExamBuilderController {
  constructor(private readonly service: ExamBuilderService) {}

  @Get()
  list() { return this.service.list(); }

  @Get(':testId')
  detail(@Param('testId') testId: string) { return this.service.detail(testId); }

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateMockTestDto) { return this.service.createTest(request.user!.id, dto); }

  @Post(':testId/publish')
  publish(@Req() request: AuthenticatedRequest, @Param('testId') testId: string) { return this.service.publish(testId, request.user!.id); }

  @Post(':testId/sections')
  addSection(@Req() request: AuthenticatedRequest, @Param('testId') testId: string, @Body() dto: CreateSectionDto) {
    return this.service.addSection(testId, request.user!.id, dto);
  }

  @Post(':testId/groups')
  addGroup(@Req() request: AuthenticatedRequest, @Param('testId') testId: string, @Body() dto: CreateGroupDto) {
    return this.service.addGroup(testId, request.user!.id, dto);
  }

  @Post(':testId/import')
  importPaper(@Req() request: AuthenticatedRequest, @Param('testId') testId: string, @Body() dto: ImportPaperDto) {
    return this.service.importPaper(testId, request.user!.id, dto);
  }

  @Put(':testId/conversions')
  replaceConversions(@Req() request: AuthenticatedRequest, @Param('testId') testId: string, @Body() dto: ReplaceConversionsDto) {
    return this.service.replaceConversions(testId, request.user!.id, dto);
  }

  @Patch(':testId')
  updateTest(@Req() request: AuthenticatedRequest, @Param('testId') testId: string, @Body() dto: UpdateMockTestDto) {
    return this.service.updateTest(testId, request.user!.id, dto);
  }

  @Patch('sections/:sectionId')
  updateSection(@Req() request: AuthenticatedRequest, @Param('sectionId') sectionId: string, @Body() dto: UpdateSectionDto) {
    return this.service.updateSection(sectionId, request.user!.id, dto);
  }

  @Delete('sections/:sectionId')
  deleteSection(@Req() request: AuthenticatedRequest, @Param('sectionId') sectionId: string) {
    return this.service.deleteSection(sectionId, request.user!.id);
  }

  @Put('sections/:sectionId/group-order')
  reorderGroups(@Req() request: AuthenticatedRequest, @Param('sectionId') sectionId: string, @Body() dto: ReorderGroupsDto) {
    return this.service.reorderGroups(sectionId, request.user!.id, dto);
  }

  @Delete('groups/:groupId')
  deleteGroup(@Req() request: AuthenticatedRequest, @Param('groupId') groupId: string) {
    return this.service.deleteGroup(groupId, request.user!.id);
  }

  @Patch('questions/:questionId')
  updateQuestion(@Req() request: AuthenticatedRequest, @Param('questionId') questionId: string, @Body() dto: UpdateGroupQuestionDto) {
    return this.service.updateQuestion(questionId, request.user!.id, dto);
  }

  @Delete('questions/:questionId')
  deleteQuestion(@Req() request: AuthenticatedRequest, @Param('questionId') questionId: string) {
    return this.service.deleteQuestion(questionId, request.user!.id);
  }

  @Patch('groups/:groupId')
  updateGroup(@Req() request: AuthenticatedRequest, @Param('groupId') groupId: string, @Body() dto: UpdateGroupDto) {
    return this.service.updateGroup(groupId, request.user!.id, dto);
  }

  @Post('groups/:groupId/media')
  attachMedia(@Req() request: AuthenticatedRequest, @Param('groupId') groupId: string, @Body() dto: AttachGroupMediaDto) {
    return this.service.attachMedia(groupId, request.user!.id, dto);
  }

  @Delete('groups/:groupId/media/:assetId')
  detachMedia(@Req() request: AuthenticatedRequest, @Param('groupId') groupId: string, @Param('assetId') assetId: string) {
    return this.service.detachMedia(groupId, assetId, request.user!.id);
  }

  @Post('groups/:groupId/questions')
  addQuestion(@Req() request: AuthenticatedRequest, @Param('groupId') groupId: string, @Body() dto: CreateGroupQuestionDto) {
    return this.service.addQuestion(groupId, request.user!.id, dto);
  }
}
