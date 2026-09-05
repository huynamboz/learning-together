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

  const listening = await ensureContent(admin.id, { slug: 'part-1-office-scene', title: 'Part 1 · Office scene', type: ContentType.LISTENING, part: 1, level: 1, payload: { transcript: 'A group of people are standing near a building.', durationSec: 22, tags: ['office', 'photographs'] } });
  const grammar = await ensureContent(admin.id, { slug: 'grammar-on-monday', title: 'Grammar · On Monday', type: ContentType.GRAMMAR, part: 5, level: 1, payload: { rule: 'Use on before days and dates.', topic: 'Prepositions of time' } });
  await ensureContent(admin.id, { slug: 'video-linking-sounds', title: 'Nối âm trong câu hỏi ngắn', type: ContentType.VIDEO, level: 1, payload: { durationSec: 504, category: 'Listening', summary: 'Nhận diện linking sounds.' } });

  let question = await prisma.question.findFirst({ where: { contentItemId: grammar.id, kind: QuestionKind.GRAMMAR } });
  if (!question) question = await prisma.question.create({ data: { contentItemId: grammar.id, kind: QuestionKind.GRAMMAR, part: 5, level: 1, prompt: { text: 'The marketing team will present the new campaign ____ Monday morning.' }, answerKey: 'B', explanation: { text: 'Use on with days of the week.' }, status: ContentStatus.PUBLISHED } });
  await Promise.all([
    prisma.questionOption.upsert({ where: { questionId_key: { questionId: question.id, key: 'A' } }, update: { text: { text: 'at' }, sortOrder: 1 }, create: { questionId: question.id, key: 'A', text: { text: 'at' }, sortOrder: 1 } }),
    prisma.questionOption.upsert({ where: { questionId_key: { questionId: question.id, key: 'B' } }, update: { text: { text: 'on' }, sortOrder: 2 }, create: { questionId: question.id, key: 'B', text: { text: 'on' }, sortOrder: 2 } }),
    prisma.questionOption.upsert({ where: { questionId_key: { questionId: question.id, key: 'C' } }, update: { text: { text: 'in' }, sortOrder: 3 }, create: { questionId: question.id, key: 'C', text: { text: 'in' }, sortOrder: 3 } }),
    prisma.questionOption.upsert({ where: { questionId_key: { questionId: question.id, key: 'D' } }, update: { text: { text: 'by' }, sortOrder: 4 }, create: { questionId: question.id, key: 'D', text: { text: 'by' }, sortOrder: 4 } })
  ]);

  const entries = await Promise.all([
    prisma.vocabularyEntry.upsert({ where: { lemma: 'allocate' }, update: { meanings: [{ vi: 'phân bổ' }], examples: [{ en: 'We need to allocate more time to training.' }] }, create: { lemma: 'allocate', partOfSpeech: 'verb', meanings: [{ vi: 'phân bổ' }], examples: [{ en: 'We need to allocate more time to training.' }] } }),
    prisma.vocabularyEntry.upsert({ where: { lemma: 'deadline' }, update: { meanings: [{ vi: 'hạn chót' }], examples: [{ en: 'The deadline for applications is Friday.' }] }, create: { lemma: 'deadline', partOfSpeech: 'noun', meanings: [{ vi: 'hạn chót' }], examples: [{ en: 'The deadline for applications is Friday.' }] } }),
    prisma.vocabularyEntry.upsert({ where: { lemma: 'negotiate' }, update: { meanings: [{ vi: 'đàm phán' }], examples: [{ en: 'They negotiated a better contract.' }] }, create: { lemma: 'negotiate', partOfSpeech: 'verb', meanings: [{ vi: 'đàm phán' }], examples: [{ en: 'They negotiated a better contract.' }] } })
  ]);
  const vocabularySet = await prisma.vocabularySet.upsert({ where: { slug: 'toeic-workplace-starter' }, update: { status: ContentStatus.PUBLISHED }, create: { slug: 'toeic-workplace-starter', title: 'TOEIC Workplace Starter', description: 'Từ vựng văn phòng cốt lõi.', status: ContentStatus.PUBLISHED } });
  await Promise.all(entries.map((entry, index) => prisma.vocabularySetItem.upsert({ where: { setId_entryId: { setId: vocabularySet.id, entryId: entry.id } }, update: { sortOrder: index + 1 }, create: { setId: vocabularySet.id, entryId: entry.id, sortOrder: index + 1 } })));
  await Promise.all(entries.map((entry) => prisma.srsCard.upsert({ where: { userId_entryId: { userId: learner.id, entryId: entry.id } }, update: { dueAt: new Date(), state: SrsState.NEW }, create: { userId: learner.id, entryId: entry.id, dueAt: new Date(), state: SrsState.NEW } })));

  const test = await prisma.mockTest.upsert({ where: { slug: 'mini-toeic-starter' }, update: { status: ContentStatus.PUBLISHED, durationMin: 10 }, create: { slug: 'mini-toeic-starter', title: 'Mini TOEIC Starter', durationMin: 10, status: ContentStatus.PUBLISHED } });
  await prisma.mockTestQuestion.upsert({ where: { testId_questionId: { testId: test.id, questionId: question.id } }, update: { sortOrder: 1, part: 5 }, create: { testId: test.id, questionId: question.id, sortOrder: 1, part: 5 } });
  const credit = await prisma.aiCreditLedger.findFirst({ where: { userId: learner.id, type: CreditEntryType.GRANT } });
  if (!credit) await prisma.aiCreditLedger.create({ data: { userId: learner.id, type: CreditEntryType.GRANT, amount: 5, balanceAfter: 5, metadata: { purpose: 'seed' } } });
  const post = await prisma.post.findFirst({ where: { authorId: learner.id, content: { contains: 'dictation' } } });
  if (!post) await prisma.post.create({ data: { authorId: learner.id, type: 'QUESTION', content: 'Mình đang luyện dictation mỗi tối, có mẹo nào để nhớ nối âm tốt hơn không?', tags: ['Listening', 'Dictation'] } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: 'SEED_COMPLETED', entity: 'System', metadata: { listeningContentId: listening.id, learnerId: learner.id } } });
  console.log(`Seed complete. Admin: ${admin.email}; learner: ${learner.email}; published content: 3.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
