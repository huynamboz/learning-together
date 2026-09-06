import * as argon2 from 'argon2';
import { ContentStatus, ContentType, CreditEntryType, PrismaClient, QuestionKind, RoleName, SrsState } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureRole(name: RoleName) {
  return prisma.role.upsert({ where: { name }, update: {}, create: { name } });
}

async function ensureUser(email: string, displayName: string, password: string, roles: RoleName[]) {
  const normalizedEmail = email.toLowerCase();
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.user.upsert({ where: { email: normalizedEmail }, update: { displayName }, create: { email: normalizedEmail, displayName } });
  await prisma.authIdentity.upsert({ where: { provider_providerAccountId: { provider: 'PASSWORD', providerAccountId: normalizedEmail } }, update: { passwordHash }, create: { userId: user.id, provider: 'PASSWORD', providerAccountId: normalizedEmail, passwordHash } });
  for (const roleName of roles) {
    const role = await ensureRole(roleName);
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
  }
  const freePlan = await prisma.plan.upsert({ where: { code: 'FREE' }, update: { displayName: 'Free' }, create: { code: 'FREE', displayName: 'Free' } });
  const entitlement = await prisma.entitlement.findFirst({ where: { userId: user.id, planId: freePlan.id, status: 'ACTIVE' } });
  if (!entitlement) await prisma.entitlement.create({ data: { userId: user.id, planId: freePlan.id } });
  return user;
}

async function ensureContent(adminId: string, input: { slug: string; title: string; type: ContentType; part?: number; level?: number; payload: Record<string, unknown> }) {
  const item = await prisma.contentItem.upsert({ where: { slug: input.slug }, update: { title: input.title, type: input.type, part: input.part, level: input.level, status: ContentStatus.PUBLISHED, updatedById: adminId }, create: { slug: input.slug, title: input.title, type: input.type, part: input.part, level: input.level, status: ContentStatus.PUBLISHED, createdById: adminId, updatedById: adminId } });
  await prisma.contentVersion.upsert({ where: { contentItemId_version: { contentItemId: item.id, version: 1 } }, update: { payload: input.payload as never, createdById: adminId }, create: { contentItemId: item.id, version: 1, payload: input.payload as never, createdById: adminId } });
  return item;
}

async function ensureQuestion(input: {
  contentItemId: string;
  kind: QuestionKind;
  part: number;
  level: number;
  prompt: string;
  answerKey: string;
  explanation: string;
  options: Array<{ key: string; text: string }>;
  order: number;
}) {
  const existing = await prisma.question.findFirst({ where: { contentItemId: input.contentItemId, prompt: { equals: { text: input.prompt } } } });
  const question = existing ?? await prisma.question.create({
    data: {
      contentItemId: input.contentItemId,
      kind: input.kind,
      part: input.part,
      level: input.level,
      prompt: { text: input.prompt },
      answerKey: input.answerKey,
      explanation: { text: input.explanation },
      status: ContentStatus.PUBLISHED
    }
  });
  await Promise.all(input.options.map((option, index) => prisma.questionOption.upsert({
    where: { questionId_key: { questionId: question.id, key: option.key } },
    update: { text: { text: option.text }, sortOrder: index + 1 },
    create: { questionId: question.id, key: option.key, text: { text: option.text }, sortOrder: index + 1 }
  })));
  return question;
}

async function ensureVocabularySet(input: { slug: string; title: string; description: string; words: Array<{ lemma: string; partOfSpeech: string; vi: string; example: string }> }) {
  const set = await prisma.vocabularySet.upsert({
    where: { slug: input.slug },
    update: { title: input.title, description: input.description, status: ContentStatus.PUBLISHED },
    create: { slug: input.slug, title: input.title, description: input.description, status: ContentStatus.PUBLISHED }
  });
  const entries = await Promise.all(input.words.map((word) => prisma.vocabularyEntry.upsert({
    where: { lemma: word.lemma },
    update: { partOfSpeech: word.partOfSpeech, meanings: [{ vi: word.vi }], examples: [{ en: word.example }] },
    create: { lemma: word.lemma, partOfSpeech: word.partOfSpeech, meanings: [{ vi: word.vi }], examples: [{ en: word.example }] }
  })));
  await Promise.all(entries.map((entry, index) => prisma.vocabularySetItem.upsert({
    where: { setId_entryId: { setId: set.id, entryId: entry.id } },
    update: { sortOrder: index + 1 },
    create: { setId: set.id, entryId: entry.id, sortOrder: index + 1 }
  })));
  return { set, entries };
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@dautoeic.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const learnerEmail = process.env.SEED_LEARNER_EMAIL ?? 'learner@dautoeic.local';
  const learnerPassword = process.env.SEED_LEARNER_PASSWORD;
  if (!adminPassword || !learnerPassword) throw new Error('SEED_ADMIN_PASSWORD and SEED_LEARNER_PASSWORD are required. They are intentionally never stored in the repository.');

  await Promise.all([
    prisma.plan.upsert({ where: { code: 'PRO' }, update: { displayName: 'Pro' }, create: { code: 'PRO', displayName: 'Pro' } }),
    prisma.plan.upsert({ where: { code: 'PREMIUM' }, update: { displayName: 'Premium' }, create: { code: 'PREMIUM', displayName: 'Premium' } })
  ]);
  const admin = await ensureUser(adminEmail, 'Đậu TOEIC Admin', adminPassword, [RoleName.SUPER_ADMIN, RoleName.ADMIN, RoleName.CONTENT_EDITOR, RoleName.MODERATOR]);
  const learner = await ensureUser(learnerEmail, 'Người học demo', learnerPassword, [RoleName.LEARNER]);

  // Listening catalog — one lesson per part so /listen has a real list to browse.
  const listening = await ensureContent(admin.id, { slug: 'part-1-office-scene', title: 'Part 1 · Office scene', type: ContentType.LISTENING, part: 1, level: 1, payload: { transcript: 'A group of people are standing near a building.', durationSec: 22, level: 1, summary: 'Mô tả tranh có nhiều người trong khu văn phòng.', tags: ['office', 'photographs'] } });
  await ensureContent(admin.id, { slug: 'part-2-short-response', title: 'Part 2 · Hỏi đáp ngắn', type: ContentType.LISTENING, part: 2, level: 1, payload: { transcript: 'Where did you put the quarterly report? — I left it on your desk.', durationSec: 18, summary: 'Nhận diện câu hỏi Wh- và phản hồi tự nhiên.', tags: ['wh-question'] } });
  await ensureContent(admin.id, { slug: 'part-3-schedule-change', title: 'Part 3 · Đổi lịch họp', type: ContentType.LISTENING, part: 3, level: 2, payload: { transcript: 'The client moved the meeting to Thursday, so we need the slides a day earlier.', durationSec: 42, summary: 'Hội thoại ngắn về thay đổi lịch làm việc.', tags: ['conversation', 'schedule'] } });
  await ensureContent(admin.id, { slug: 'part-4-store-announcement', title: 'Part 4 · Thông báo tại cửa hàng', type: ContentType.LISTENING, part: 4, level: 2, payload: { transcript: 'Attention shoppers: the pharmacy counter will close thirty minutes early today.', durationSec: 36, summary: 'Bài nói ngắn dạng thông báo công cộng.', tags: ['announcement'] } });

  // Grammar and reading lessons, each with its own questions.
  const grammar = await ensureContent(admin.id, { slug: 'grammar-on-monday', title: 'Giới từ chỉ thời gian', type: ContentType.GRAMMAR, part: 5, level: 1, payload: { topic: 'Prepositions of time', summary: 'Chọn đúng at / on / in cho mốc thời gian.', rule: 'Use on before days and dates.' } });
  const agreement = await ensureContent(admin.id, { slug: 'grammar-subject-verb', title: 'Hòa hợp chủ ngữ và động từ', type: ContentType.GRAMMAR, part: 5, level: 2, payload: { topic: 'Subject-verb agreement', summary: 'Chủ ngữ dài không làm đổi dạng động từ.', rule: 'The verb agrees with the head noun, not the modifier.' } });
  const relative = await ensureContent(admin.id, { slug: 'grammar-relative-clause', title: 'Mệnh đề quan hệ', type: ContentType.GRAMMAR, part: 5, level: 3, payload: { topic: 'Relative clauses', summary: 'Chọn who / which / that theo danh từ đứng trước.', rule: 'Use who for people and which for things.' } });
  const reading = await ensureContent(admin.id, { slug: 'reading-office-relocation', title: 'Office Relocation Notice', type: ContentType.READING, part: 7, level: 2, payload: { textType: 'Notice', summary: 'Thông báo chuyển văn phòng gửi toàn công ty.', passage: 'All departments will move to the new Riverside office on 14 March. Pack personal items by 12 March; the facilities team will move furniture and monitors. Parking passes stay valid and do not need to be reissued.' } });

  await ensureQuestion({ contentItemId: grammar.id, kind: QuestionKind.GRAMMAR, part: 5, level: 1, order: 1, prompt: 'The marketing team will present the new campaign ____ Monday morning.', answerKey: 'B', explanation: 'Dùng on với thứ trong tuần.', options: [{ key: 'A', text: 'at' }, { key: 'B', text: 'on' }, { key: 'C', text: 'in' }, { key: 'D', text: 'by' }] });
  await ensureQuestion({ contentItemId: grammar.id, kind: QuestionKind.GRAMMAR, part: 5, level: 1, order: 2, prompt: 'The store opens ____ 9 a.m. every weekday.', answerKey: 'A', explanation: 'Dùng at với một mốc giờ cụ thể.', options: [{ key: 'A', text: 'at' }, { key: 'B', text: 'on' }, { key: 'C', text: 'in' }, { key: 'D', text: 'for' }] });
  await ensureQuestion({ contentItemId: agreement.id, kind: QuestionKind.GRAMMAR, part: 5, level: 2, order: 1, prompt: 'The list of approved suppliers ____ updated every quarter.', answerKey: 'A', explanation: 'Chủ ngữ chính là list, số ít, nên dùng is.', options: [{ key: 'A', text: 'is' }, { key: 'B', text: 'are' }, { key: 'C', text: 'were' }, { key: 'D', text: 'have been' }] });
  await ensureQuestion({ contentItemId: relative.id, kind: QuestionKind.GRAMMAR, part: 5, level: 3, order: 1, prompt: 'We hired a consultant ____ specialises in supply chain audits.', answerKey: 'C', explanation: 'Danh từ chỉ người nên dùng who.', options: [{ key: 'A', text: 'which' }, { key: 'B', text: 'whose' }, { key: 'C', text: 'who' }, { key: 'D', text: 'where' }] });
  await ensureQuestion({ contentItemId: reading.id, kind: QuestionKind.READING, part: 7, level: 2, order: 1, prompt: 'What must employees do before 12 March?', answerKey: 'B', explanation: 'Thông báo yêu cầu nhân viên tự đóng gói đồ cá nhân trước ngày 12/3.', options: [{ key: 'A', text: 'Move their own monitors' }, { key: 'B', text: 'Pack their personal items' }, { key: 'C', text: 'Apply for a new parking pass' }, { key: 'D', text: 'Confirm the new address' }] });
  await ensureQuestion({ contentItemId: reading.id, kind: QuestionKind.READING, part: 7, level: 2, order: 2, prompt: 'What does the notice say about parking passes?', answerKey: 'D', explanation: 'Thông báo nói thẻ gửi xe vẫn còn hiệu lực.', options: [{ key: 'A', text: 'They cost more at the new site' }, { key: 'B', text: 'They must be returned' }, { key: 'C', text: 'They are issued on 14 March' }, { key: 'D', text: 'They remain valid' }] });

  // Writing prompts and video lessons.
  await ensureContent(admin.id, { slug: 'writing-part1-office-desk', title: 'Part 1 · worker / desk', type: ContentType.WRITING, part: 1, level: 1, payload: { promptType: 'picture', keywords: ['worker', 'desk'], summary: 'Viết một câu mô tả tranh dùng đúng hai từ khóa.', instruction: 'Viết một câu tối đa 40 từ, dùng cả hai từ khóa.', wordLimit: 40 } });
  await ensureContent(admin.id, { slug: 'writing-part2-printer-jam', title: 'Part 2 · Printer paper jam', type: ContentType.WRITING, part: 2, level: 2, payload: { promptType: 'email', summary: 'Trả lời email khiếu nại về máy in kẹt giấy.', instruction: 'Viết email 80–120 từ: xin lỗi, giải thích nguyên nhân và đề xuất một bước xử lý.', wordLimit: 120 } });
  await ensureContent(admin.id, { slug: 'writing-part2-missing-accessories', title: 'Part 2 · Missing accessories', type: ContentType.WRITING, part: 2, level: 2, payload: { promptType: 'email', summary: 'Phản hồi đơn hàng giao thiếu phụ kiện.', instruction: 'Viết email 80–120 từ: xác nhận vấn đề, nêu cách bù và mốc thời gian.', wordLimit: 120 } });

  await ensureContent(admin.id, { slug: 'video-linking-sounds', title: 'Nối âm trong câu hỏi ngắn', type: ContentType.VIDEO, level: 1, payload: { durationSec: 504, category: 'Listening', summary: 'Nhận diện linking sounds.' } });
  await ensureContent(admin.id, { slug: 'video-part5-word-forms', title: 'Part 5 · Nhận diện từ loại', type: ContentType.VIDEO, level: 2, payload: { durationSec: 733, category: 'Grammar', summary: 'Nhìn vị trí trống để đoán từ loại trước khi đọc nghĩa.' } });
  await ensureContent(admin.id, { slug: 'video-ipa-basics', title: 'Bảng IPA cho người mới', type: ContentType.VIDEO, level: 1, payload: { durationSec: 612, category: 'Phát âm', summary: 'Đọc được ký hiệu IPA trong từ điển.' } });

  // Vocabulary sets browsable without an account; SRS cards stay per learner.
  const starter = await ensureVocabularySet({
    slug: 'toeic-workplace-starter',
    title: 'TOEIC Workplace Starter',
    description: 'Từ vựng văn phòng cốt lõi.',
    words: [
      { lemma: 'allocate', partOfSpeech: 'verb', vi: 'phân bổ', example: 'We need to allocate more time to training.' },
      { lemma: 'deadline', partOfSpeech: 'noun', vi: 'hạn chót', example: 'The deadline for applications is Friday.' },
      { lemma: 'negotiate', partOfSpeech: 'verb', vi: 'đàm phán', example: 'They negotiated a better contract.' }
    ]
  });
  await ensureVocabularySet({
    slug: 'meetings-and-schedules',
    title: 'Meetings & Schedules',
    description: 'Từ hay gặp trong Part 3 và email nội bộ.',
    words: [
      { lemma: 'agenda', partOfSpeech: 'noun', vi: 'chương trình họp', example: 'Please review the agenda before the call.' },
      { lemma: 'postpone', partOfSpeech: 'verb', vi: 'hoãn lại', example: 'We postponed the review until next week.' },
      { lemma: 'attendee', partOfSpeech: 'noun', vi: 'người tham dự', example: 'Every attendee received a summary.' },
      { lemma: 'venue', partOfSpeech: 'noun', vi: 'địa điểm', example: 'The venue seats forty people.' }
    ]
  });
  await ensureVocabularySet({
    slug: 'shipping-and-orders',
    title: 'Shipping & Orders',
    description: 'Từ vựng đơn hàng, giao nhận và khiếu nại.',
    words: [
      { lemma: 'invoice', partOfSpeech: 'noun', vi: 'hóa đơn', example: 'The invoice is attached to this email.' },
      { lemma: 'shipment', partOfSpeech: 'noun', vi: 'lô hàng', example: 'The shipment arrives on Tuesday.' },
      { lemma: 'refund', partOfSpeech: 'noun', vi: 'khoản hoàn tiền', example: 'We issued a full refund.' },
      { lemma: 'defective', partOfSpeech: 'adjective', vi: 'bị lỗi', example: 'Two units were defective.' }
    ]
  });
  const entries = starter.entries;
  await Promise.all(entries.map((entry) => prisma.srsCard.upsert({ where: { userId_entryId: { userId: learner.id, entryId: entry.id } }, update: { dueAt: new Date(), state: SrsState.NEW }, create: { userId: learner.id, entryId: entry.id, dueAt: new Date(), state: SrsState.NEW } })));

  const grammarQuestions = await prisma.question.findMany({ where: { contentItemId: { in: [grammar.id, agreement.id, relative.id] } }, orderBy: { createdAt: 'asc' } });
  const readingQuestions = await prisma.question.findMany({ where: { contentItemId: reading.id }, orderBy: { createdAt: 'asc' } });

  const starterTest = await prisma.mockTest.upsert({ where: { slug: 'mini-toeic-starter' }, update: { status: ContentStatus.PUBLISHED, durationMin: 10 }, create: { slug: 'mini-toeic-starter', title: 'Mini TOEIC Starter', durationMin: 10, status: ContentStatus.PUBLISHED } });
  await Promise.all(grammarQuestions.map((item, index) => prisma.mockTestQuestion.upsert({ where: { testId_questionId: { testId: starterTest.id, questionId: item.id } }, update: { sortOrder: index + 1, part: 5 }, create: { testId: starterTest.id, questionId: item.id, sortOrder: index + 1, part: 5 } })));

  const readingTest = await prisma.mockTest.upsert({ where: { slug: 'mini-reading-drill' }, update: { status: ContentStatus.PUBLISHED, durationMin: 15 }, create: { slug: 'mini-reading-drill', title: 'Mini Reading Drill · Part 7', durationMin: 15, status: ContentStatus.PUBLISHED } });
  await Promise.all(readingQuestions.map((item, index) => prisma.mockTestQuestion.upsert({ where: { testId_questionId: { testId: readingTest.id, questionId: item.id } }, update: { sortOrder: index + 1, part: 7 }, create: { testId: readingTest.id, questionId: item.id, sortOrder: index + 1, part: 7 } })));
  const credit = await prisma.aiCreditLedger.findFirst({ where: { userId: learner.id, type: CreditEntryType.GRANT } });
  if (!credit) await prisma.aiCreditLedger.create({ data: { userId: learner.id, type: CreditEntryType.GRANT, amount: 5, balanceAfter: 5, metadata: { purpose: 'seed' } } });
  const post = await prisma.post.findFirst({ where: { authorId: learner.id, content: { contains: 'dictation' } } });
  if (!post) await prisma.post.create({ data: { authorId: learner.id, type: 'QUESTION', content: 'Mình đang luyện dictation mỗi tối, có mẹo nào để nhớ nối âm tốt hơn không?', tags: ['Listening', 'Dictation'] } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: 'SEED_COMPLETED', entity: 'System', metadata: { listeningContentId: listening.id, learnerId: learner.id } } });
  const publishedContent = await prisma.contentItem.count({ where: { status: ContentStatus.PUBLISHED } });
  console.log(`Seed complete. Admin: ${admin.email}; learner: ${learner.email}; published content: ${publishedContent}.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
