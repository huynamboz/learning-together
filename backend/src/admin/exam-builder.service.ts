import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, MediaStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { ApiError } from '@/common/http/api-error';
import {
  AttachGroupMediaDto,
  CreateGroupDto,
  CreateGroupQuestionDto,
  CreateMockTestDto,
  CreateSectionDto,
  ReplaceConversionsDto,
  UpdateGroupDto
} from './exam-builder.dto';

/** Part 1 shows a photograph and Part 3/4 may show a chart; nothing else takes group media. */
const MEDIA_PARTS = new Set([1, 3, 4]);

@Injectable()
export class ExamBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  private audit(tx: Prisma.TransactionClient, actorId: string, action: string, entity: string, entityId: string, metadata: Prisma.InputJsonValue) {
    return tx.auditLog.create({ data: { actorId, action, entity, entityId, metadata } });
  }

  list() {
    return this.prisma.mockTest.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true, slug: true, title: true, durationMin: true, status: true, updatedAt: true,
        sections: { orderBy: { sortOrder: 'asc' }, select: { id: true, kind: true, label: true, durationMin: true, sortOrder: true } },
        _count: { select: { questions: true, conversions: true } }
      }
    }).then((tests) => tests.map(({ _count, ...test }) => ({ ...test, questionCount: _count.questions, conversionCount: _count.conversions })));
  }

  /** The whole authoring tree for one form: sections, their groups, and each group's questions. */
  async detail(testId: string) {
    const test = await this.prisma.mockTest.findUnique({
      where: { id: testId },
      select: {
        id: true, slug: true, title: true, durationMin: true, status: true,
        sections: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true, kind: true, label: true, durationMin: true, sortOrder: true,
            groups: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true, type: true, part: true, sortOrder: true, stimulus: true, transcript: true,
                audioAssetId: true, audioStartSec: true, audioEndSec: true,
                media: { orderBy: { sortOrder: 'asc' }, select: { assetId: true, role: true, caption: true, sortOrder: true, asset: { select: { originalName: true, mimeType: true, status: true, visibility: true } } } },
                questions: {
                  orderBy: [{ numberInTest: 'asc' }, { createdAt: 'asc' }],
                  select: { id: true, kind: true, prompt: true, answerKey: true, numberInTest: true, optionsHidden: true, options: { orderBy: { sortOrder: 'asc' }, select: { key: true, text: true } } }
                }
              }
            }
          }
        },
        conversions: { orderBy: [{ section: 'asc' }, { rawCorrect: 'asc' }], select: { section: true, rawCorrect: true, scaled: true } }
      }
    });
    if (!test) throw new NotFoundException('Không tìm thấy đề thi.');
    return test;
  }

  async createTest(actorId: string, dto: CreateMockTestDto) {
    const existing = await this.prisma.mockTest.findUnique({ where: { slug: dto.slug }, select: { id: true } });
    if (existing) throw new ApiError('MOCK_TEST_SLUG_TAKEN', 'Slug này đã được dùng cho một đề khác.', {}, 409);
    return this.prisma.$transaction(async (tx) => {
      const test = await tx.mockTest.create({ data: { slug: dto.slug, title: dto.title, durationMin: dto.durationMin } });
      await this.audit(tx, actorId, 'MOCK_TEST_CREATED', 'MockTest', test.id, { slug: test.slug });
      return test;
    });
  }

  async publish(testId: string, actorId: string) {
    const test = await this.prisma.mockTest.findUnique({ where: { id: testId }, select: { id: true, title: true, _count: { select: { questions: true } } } });
    if (!test) throw new NotFoundException('Không tìm thấy đề thi.');
    if (!test._count.questions) throw new ApiError('MOCK_TEST_EMPTY', 'Đề chưa có câu hỏi nào nên chưa thể publish.', {}, 422);
    return this.prisma.$transaction(async (tx) => {
      const published = await tx.mockTest.update({ where: { id: testId }, data: { status: ContentStatus.PUBLISHED }, select: { id: true, status: true } });
      await this.audit(tx, actorId, 'MOCK_TEST_PUBLISHED', 'MockTest', testId, { title: test.title });
      return published;
    });
  }

  async addSection(testId: string, actorId: string, dto: CreateSectionDto) {
    const test = await this.prisma.mockTest.findUnique({ where: { id: testId }, select: { id: true } });
    if (!test) throw new NotFoundException('Không tìm thấy đề thi.');
    const last = await this.prisma.mockTestSection.findFirst({ where: { testId }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    return this.prisma.$transaction(async (tx) => {
      const section = await tx.mockTestSection.create({ data: { testId, kind: dto.kind, label: dto.label, durationMin: dto.durationMin, sortOrder: (last?.sortOrder ?? 0) + 1 } });
      await this.audit(tx, actorId, 'EXAM_SECTION_CREATED', 'MockTestSection', section.id, { testId, kind: dto.kind });
      return section;
    });
  }

  async addGroup(testId: string, actorId: string, dto: CreateGroupDto) {
    const section = await this.prisma.mockTestSection.findFirst({ where: { id: dto.sectionId, testId }, select: { id: true } });
    if (!section) throw new ApiError('SECTION_NOT_IN_TEST', 'Section không thuộc đề thi này.', {}, 422);
    const last = await this.prisma.questionGroup.findFirst({ where: { sectionId: section.id }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.questionGroup.create({
        data: {
          sectionId: section.id,
          type: dto.type,
          part: dto.part,
          sortOrder: (last?.sortOrder ?? 0) + 1,
          stimulus: (dto.stimulus ?? {}) as Prisma.InputJsonValue,
          transcript: dto.transcript ?? null
        }
      });
      await this.audit(tx, actorId, 'QUESTION_GROUP_CREATED', 'QuestionGroup', group.id, { testId, part: dto.part, type: dto.type });
      return group;
    });
  }

  async updateGroup(groupId: string, actorId: string, dto: UpdateGroupDto) {
    const group = await this.prisma.questionGroup.findUnique({ where: { id: groupId }, select: { id: true, part: true } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm câu hỏi.');
    if (dto.audioAssetId) await this.assertPlayableAsset(dto.audioAssetId, 'audio/');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.questionGroup.update({
        where: { id: groupId },
        data: {
          ...(dto.stimulus === undefined ? {} : { stimulus: dto.stimulus as Prisma.InputJsonValue }),
          ...(dto.transcript === undefined ? {} : { transcript: dto.transcript || null }),
          ...(dto.audioAssetId === undefined ? {} : { audioAssetId: dto.audioAssetId || null }),
          ...(dto.audioStartSec === undefined ? {} : { audioStartSec: dto.audioStartSec }),
          ...(dto.audioEndSec === undefined ? {} : { audioEndSec: dto.audioEndSec })
        },
        select: { id: true, audioAssetId: true, audioStartSec: true, audioEndSec: true }
      });
      await this.audit(tx, actorId, 'QUESTION_GROUP_UPDATED', 'QuestionGroup', groupId, { fields: Object.keys(dto) });
      return updated;
    });
  }

  /** A group can hold several ordered images — six photographs in Part 1, a chart in Part 3. */
  async attachMedia(groupId: string, actorId: string, dto: AttachGroupMediaDto) {
    const group = await this.prisma.questionGroup.findUnique({ where: { id: groupId }, select: { id: true, part: true } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm câu hỏi.');
    if (!MEDIA_PARTS.has(group.part)) throw new ApiError('GROUP_TAKES_NO_MEDIA', 'Chỉ Part 1, 3 và 4 nhận ảnh hoặc biểu đồ.', { part: group.part }, 422);
    await this.assertPlayableAsset(dto.assetId, 'image/');
    const last = await this.prisma.questionGroupMedia.findFirst({ where: { groupId }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    return this.prisma.$transaction(async (tx) => {
      const media = await tx.questionGroupMedia.upsert({
        where: { groupId_assetId: { groupId, assetId: dto.assetId } },
        update: { role: dto.role ?? 'photo', caption: dto.caption ?? null },
        create: { groupId, assetId: dto.assetId, role: dto.role ?? 'photo', caption: dto.caption ?? null, sortOrder: (last?.sortOrder ?? 0) + 1 }
      });
      await this.audit(tx, actorId, 'QUESTION_GROUP_MEDIA_ATTACHED', 'QuestionGroup', groupId, { assetId: dto.assetId, role: media.role });
      return media;
    });
  }

  async detachMedia(groupId: string, assetId: string, actorId: string) {
    const media = await this.prisma.questionGroupMedia.findUnique({ where: { groupId_assetId: { groupId, assetId } }, select: { groupId: true } });
    if (!media) throw new NotFoundException('Nhóm này không gắn asset đó.');
    return this.prisma.$transaction(async (tx) => {
      await tx.questionGroupMedia.delete({ where: { groupId_assetId: { groupId, assetId } } });
      await this.audit(tx, actorId, 'QUESTION_GROUP_MEDIA_DETACHED', 'QuestionGroup', groupId, { assetId });
      return { groupId, assetId };
    });
  }

  /**
   * Adding a question to a group also enrols it in the test, carrying the section along, so the
   * exam runner picks it up without a second manual step.
   */
  async addQuestion(groupId: string, actorId: string, dto: CreateGroupQuestionDto) {
    const group = await this.prisma.questionGroup.findUnique({ where: { id: groupId }, select: { id: true, part: true, sectionId: true, section: { select: { testId: true } } } });
    if (!group) throw new NotFoundException('Không tìm thấy nhóm câu hỏi.');
    if (!group.section) throw new ApiError('GROUP_NOT_IN_TEST', 'Nhóm này chưa thuộc đề thi nào.', {}, 422);
    if (!dto.options.some((option) => option.key.trim().toLowerCase() === dto.answerKey.trim().toLowerCase())) {
      throw new ApiError('ANSWER_KEY_NOT_IN_OPTIONS', 'Đáp án đúng phải nằm trong danh sách lựa chọn.', { answerKey: dto.answerKey }, 422);
    }
    const keys = dto.options.map((option) => option.key.trim().toUpperCase());
    if (new Set(keys).size !== keys.length) throw new ApiError('DUPLICATE_OPTION_KEY', 'Các lựa chọn phải có ký hiệu khác nhau.', {}, 422);

    const testId = group.section.testId;
    const last = await this.prisma.mockTestQuestion.findFirst({ where: { testId }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });

    return this.prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          groupId,
          kind: dto.kind,
          part: group.part,
          level: dto.level ?? 1,
          numberInTest: dto.numberInTest ?? null,
          optionsHidden: dto.optionsHidden ?? false,
          prompt: { text: dto.prompt } as Prisma.InputJsonValue,
          answerKey: dto.answerKey.trim().toUpperCase(),
          explanation: dto.explanation ? ({ text: dto.explanation } as Prisma.InputJsonValue) : undefined,
          status: ContentStatus.PUBLISHED,
          options: { create: dto.options.map((option, index) => ({ key: option.key.trim().toUpperCase(), text: { text: option.text } as Prisma.InputJsonValue, sortOrder: index + 1 })) }
        },
        select: { id: true, numberInTest: true }
      });
      await tx.mockTestQuestion.create({ data: { testId, questionId: question.id, sectionId: group.sectionId, sortOrder: (last?.sortOrder ?? 0) + 1, part: group.part } });
      await this.audit(tx, actorId, 'EXAM_QUESTION_CREATED', 'Question', question.id, { testId, groupId, numberInTest: question.numberInTest });
      return question;
    });
  }

  /** The table is replaced wholesale: a half-updated conversion would mis-score every result. */
  async replaceConversions(testId: string, actorId: string, dto: ReplaceConversionsDto) {
    const test = await this.prisma.mockTest.findUnique({ where: { id: testId }, select: { id: true } });
    if (!test) throw new NotFoundException('Không tìm thấy đề thi.');
    const seen = new Set(dto.rows.map((row) => `${row.section}:${row.rawCorrect}`));
    if (seen.size !== dto.rows.length) throw new ApiError('DUPLICATE_CONVERSION_ROW', 'Bảng quy đổi có dòng trùng section và số câu đúng.', {}, 422);

    return this.prisma.$transaction(async (tx) => {
      await tx.scoreConversion.deleteMany({ where: { testId } });
      if (dto.rows.length) await tx.scoreConversion.createMany({ data: dto.rows.map((row) => ({ testId, section: row.section, rawCorrect: row.rawCorrect, scaled: row.scaled })) });
      await this.audit(tx, actorId, 'SCORE_CONVERSION_REPLACED', 'MockTest', testId, { rows: dto.rows.length });
      return { testId, rows: dto.rows.length };
    });
  }

  private async assertPlayableAsset(assetId: string, mimePrefix: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id: assetId }, select: { status: true, visibility: true, mimeType: true } });
    if (!asset) throw new NotFoundException('Không tìm thấy asset.');
    if (asset.status !== MediaStatus.READY) throw new ApiError('ASSET_NOT_READY', 'Asset chưa ở trạng thái READY.', {}, 422);
    if (asset.visibility !== 'public') throw new ApiError('ASSET_NOT_PUBLIC', 'Asset phải được cho phép phát công khai trước khi gắn.', {}, 422);
    if (!asset.mimeType.startsWith(mimePrefix)) throw new ApiError('ASSET_MIME_MISMATCH', `Cần asset có MIME bắt đầu bằng ${mimePrefix}`, { mimeType: asset.mimeType }, 422);
  }
}
