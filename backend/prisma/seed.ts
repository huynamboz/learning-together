import * as argon2 from 'argon2';
import { ContentStatus, ContentType, CreditEntryType, ExamSectionKind, PrismaClient, QuestionGroupType, QuestionKind, RoleName, SrsState } from '@prisma/client';

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
  contentItemId?: string;
  groupId?: string;
  numberInTest?: number;
  optionsHidden?: boolean;
  kind: QuestionKind;
  part: number;
  level: number;
  prompt: string;
  answerKey: string;
  explanation: string;
  options: Array<{ key: string; text: string }>;
  order: number;
}) {
  const existing = await prisma.question.findFirst({ where: { prompt: { equals: { text: input.prompt } }, ...(input.groupId ? { groupId: input.groupId } : { contentItemId: input.contentItemId }) } });
  const data = {
    contentItemId: input.contentItemId ?? null,
    groupId: input.groupId ?? null,
    numberInTest: input.numberInTest ?? null,
    optionsHidden: input.optionsHidden ?? false,
    kind: input.kind,
    part: input.part,
    level: input.level,
    prompt: { text: input.prompt },
    answerKey: input.answerKey,
    explanation: { text: input.explanation },
    status: ContentStatus.PUBLISHED
  };
  const question = existing
    ? await prisma.question.update({ where: { id: existing.id }, data })
    : await prisma.question.create({ data });
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

/**
 * Builds one test in the real TOEIC shape: sections that are timed separately, and question
 * groups that own the stimulus their questions hang off. Every group type is exercised so the
 * runner has something to render for each of the seven parts.
 */
async function ensureFormattedMockTest() {
  const test = await prisma.mockTest.upsert({
    where: { slug: 'mini-toeic-full-format' },
    update: { title: 'Mini TOEIC · đủ 7 dạng', durationMin: 20, status: ContentStatus.PUBLISHED },
    create: { slug: 'mini-toeic-full-format', title: 'Mini TOEIC · đủ 7 dạng', durationMin: 20, status: ContentStatus.PUBLISHED }
  });

  async function ensureSection(kind: ExamSectionKind, label: string, durationMin: number, sortOrder: number) {
    const existing = await prisma.mockTestSection.findFirst({ where: { testId: test.id, sortOrder } });
    return existing
      ? prisma.mockTestSection.update({ where: { id: existing.id }, data: { kind, label, durationMin } })
      : prisma.mockTestSection.create({ data: { testId: test.id, kind, label, durationMin, sortOrder } });
  }

  async function ensureGroup(input: { sectionId: string; type: QuestionGroupType; part: number; sortOrder: number; stimulus: Record<string, unknown>; transcript?: string }) {
    const existing = await prisma.questionGroup.findFirst({ where: { sectionId: input.sectionId, sortOrder: input.sortOrder } });
    const data = { type: input.type, part: input.part, stimulus: input.stimulus as never, transcript: input.transcript ?? null };
    return existing
      ? prisma.questionGroup.update({ where: { id: existing.id }, data })
      : prisma.questionGroup.create({ data: { ...data, sectionId: input.sectionId, sortOrder: input.sortOrder } });
  }

  const listening = await ensureSection(ExamSectionKind.LISTENING, 'Listening', 8, 1);
  const reading = await ensureSection(ExamSectionKind.READING, 'Reading', 12, 2);

  const abcd = (a: string, b: string, c: string, d: string) => [{ key: 'A', text: a }, { key: 'B', text: b }, { key: 'C', text: c }, { key: 'D', text: d }];
  const items: Array<{ id: string; sectionId: string }> = [];
  const add = (question: { id: string }, sectionId: string) => { items.push({ id: question.id, sectionId }); };

  // Part 1 — only the photograph is printed; the four statements are audio-only.
  const photo = await ensureGroup({
    sectionId: listening.id, type: QuestionGroupType.PHOTO, part: 1, sortOrder: 1,
    stimulus: { directions: 'Chọn câu mô tả đúng nhất tấm ảnh.', photoCaption: 'Một người đang xếp hộp lên xe đẩy trong kho.' },
    transcript: '(W-Am) (A) He is loading boxes onto a cart. (B) He is opening a delivery van. (C) He is stacking shelves. (D) He is sweeping the floor.'
  });
  add(await ensureQuestion({
    groupId: photo.id, numberInTest: 1, optionsHidden: true, kind: QuestionKind.LISTENING, part: 1, level: 1, order: 1,
    prompt: 'Nghe bốn câu mô tả và chọn câu đúng nhất với tấm ảnh.', answerKey: 'A',
    explanation: 'Người trong ảnh đang xếp hộp lên xe đẩy, khớp với câu (A).',
    options: abcd('He is loading boxes onto a cart.', 'He is opening a delivery van.', 'He is stacking shelves.', 'He is sweeping the floor.')
  }), listening.id);

  // Part 2 — nothing at all is printed, and there are only three responses.
  const response = await ensureGroup({
    sectionId: listening.id, type: QuestionGroupType.SHORT_RESPONSE, part: 2, sortOrder: 2,
    stimulus: { directions: 'Nghe câu hỏi và ba phản hồi, chọn phản hồi phù hợp nhất.' },
    transcript: "(W-Br) Where's the new fax machine? (M-Cn) (A) Next to the copier. (B) Yes, I sent it. (C) About twenty pages."
  });
  add(await ensureQuestion({
    groupId: response.id, numberInTest: 7, optionsHidden: true, kind: QuestionKind.LISTENING, part: 2, level: 1, order: 1,
    prompt: 'Mark your answer on your answer sheet.', answerKey: 'A',
    explanation: 'Câu hỏi hỏi vị trí, nên phản hồi chỉ nơi chốn là phù hợp.',
    options: [{ key: 'A', text: 'Next to the copier.' }, { key: 'B', text: 'Yes, I sent it.' }, { key: 'C', text: 'About twenty pages.' }]
  }), listening.id);

  // Part 3 — one conversation feeds three printed questions.
  const conversation = await ensureGroup({
    sectionId: listening.id, type: QuestionGroupType.CONVERSATION, part: 3, sortOrder: 3,
    stimulus: { directions: 'Nghe hội thoại rồi trả lời ba câu hỏi.', speakers: 2 },
    transcript: '(W-Am) Hi, I ordered a desk lamp last week but it arrived damaged. (M-Au) I am sorry about that. I can send a replacement today, or refund you in full. (W-Am) A replacement is fine, as long as it gets here before Friday.'
  });
  const conversationQuestions = [
    { number: 32, prompt: 'Why is the woman calling?', key: 'B', explanation: 'Cô ấy gọi vì món hàng nhận được bị hỏng.', options: abcd('To cancel an order', 'To report a damaged item', 'To change an address', 'To ask about a discount') },
    { number: 33, prompt: 'What does the man offer to do?', key: 'C', explanation: 'Anh ấy đề nghị gửi hàng thay thế hoặc hoàn tiền.', options: abcd('Waive a delivery fee', 'Extend a warranty', 'Send a replacement', 'Call a supervisor') },
    { number: 34, prompt: 'What does the woman require?', key: 'A', explanation: 'Cô ấy chỉ yêu cầu hàng đến trước thứ Sáu.', options: abcd('Delivery before Friday', 'A written apology', 'A full refund', 'An upgraded model') }
  ];
  for (const [index, item] of conversationQuestions.entries()) {
    add(await ensureQuestion({ groupId: conversation.id, numberInTest: item.number, kind: QuestionKind.LISTENING, part: 3, level: 2, order: index + 1, prompt: item.prompt, answerKey: item.key, explanation: item.explanation, options: item.options }), listening.id);
  }

  // Part 4 — a single speaker, three printed questions.
  const talk = await ensureGroup({
    sectionId: listening.id, type: QuestionGroupType.TALK, part: 4, sortOrder: 4,
    stimulus: { directions: 'Nghe bài nói rồi trả lời ba câu hỏi.', talkType: 'Telephone message' },
    transcript: '(M-Cn) Hello Ms. Tran, this is Daniel from Brightline Auto. Your car is ready, and the repair is covered by your warranty, so there is nothing to pay. We close at six, but I can leave the keys at the front desk if you arrive later.'
  });
  const talkQuestions = [
    { number: 71, prompt: 'What does the speaker say about the repair?', key: 'D', explanation: 'Anh ấy nói chi phí đã được bảo hành chi trả.', options: abcd('It is not required.', 'It has been delayed.', 'It will be expensive.', 'It is covered by a warranty.') },
    { number: 72, prompt: 'What is the listener asked to consider?', key: 'B', explanation: 'Người gọi nhắc giờ đóng cửa để người nghe sắp xếp thời gian đến.', options: abcd('Booking a second service', 'The closing time of the shop', 'Buying a replacement part', 'Renewing a warranty') },
    { number: 73, prompt: 'What will happen if the listener arrives late?', key: 'A', explanation: 'Chìa khóa sẽ được để lại ở quầy lễ tân.', options: abcd('Keys will be left at the front desk.', 'The car will be moved to a lot.', 'The repair will be rescheduled.', 'A fee will be added.') }
  ];
  for (const [index, item] of talkQuestions.entries()) {
    add(await ensureQuestion({ groupId: talk.id, numberInTest: item.number, kind: QuestionKind.LISTENING, part: 4, level: 2, order: index + 1, prompt: item.prompt, answerKey: item.key, explanation: item.explanation, options: item.options }), listening.id);
  }

  // Part 5 — each sentence stands alone, so each is its own group of one.
  const singles = [
    { sortOrder: 5, number: 101, prompt: 'The marketing team will present the new campaign ____ Monday morning.', key: 'B', explanation: 'Dùng on với thứ trong tuần.', options: abcd('at', 'on', 'in', 'by') },
    { sortOrder: 6, number: 102, prompt: 'The list of approved suppliers ____ updated every quarter.', key: 'A', explanation: 'Chủ ngữ chính là list, số ít.', options: abcd('is', 'are', 'were', 'have been') }
  ];
  for (const single of singles) {
    const group = await ensureGroup({ sectionId: reading.id, type: QuestionGroupType.SINGLE_SENTENCE, part: 5, sortOrder: single.sortOrder, stimulus: { directions: 'Chọn từ hoặc cụm từ điền vào chỗ trống.' } });
    add(await ensureQuestion({ groupId: group.id, numberInTest: single.number, kind: QuestionKind.GRAMMAR, part: 5, level: 2, order: 1, prompt: single.prompt, answerKey: single.key, explanation: single.explanation, options: single.options }), reading.id);
  }

  // Part 6 — one text, four blanks, and one of those blanks takes a whole sentence.
  const completion = await ensureGroup({
    sectionId: reading.id, type: QuestionGroupType.TEXT_COMPLETION, part: 6, sortOrder: 7,
    stimulus: {
      directions: 'Đọc văn bản và chọn phương án điền vào mỗi chỗ trống.',
      passages: [{
        label: 'E-mail',
        body: 'To all Pak Designs project leaders:\n\nIn the coming weeks we will be organizing several training sessions for ---(131)--- employees. With support from senior leaders, less experienced staff can quickly ---(132)--- a deep understanding of the design process. ---(133)---, they can improve how they communicate across divisions.\n\n---(134)---\n\nThank you for your support.\nJames Pak'
      }]
    }
  });
  const completionQuestions = [
    { number: 131, prompt: 'Chỗ trống (131)', key: 'C', explanation: 'Buổi tập huấn dành cho nhân viên mới vào nghề.', options: abcd('interested', 'retiring', 'incoming', 'departing') },
    { number: 132, prompt: 'Chỗ trống (132)', key: 'A', explanation: 'gain a deep understanding là cụm cố định.', options: abcd('gain', 'give', 'take', 'make') },
    { number: 133, prompt: 'Chỗ trống (133)', key: 'D', explanation: 'Câu sau bổ sung thêm một lợi ích nữa.', options: abcd('However', 'Instead', 'Otherwise', 'In addition') },
    { number: 134, prompt: 'Chỗ trống (134) — chọn câu phù hợp nhất để điền vào đoạn', key: 'B', explanation: 'Chỉ câu này nối tiếp lời kêu gọi tham dự buổi tập huấn.', options: abcd('The office will be closed next week.', 'Please sign up for a session before Friday.', 'Our new logo has been approved.', 'Parking passes remain valid.') }
  ];
  for (const [index, item] of completionQuestions.entries()) {
    add(await ensureQuestion({ groupId: completion.id, numberInTest: item.number, kind: QuestionKind.READING, part: 6, level: 2, order: index + 1, prompt: item.prompt, answerKey: item.key, explanation: item.explanation, options: item.options }), reading.id);
  }

  // Part 7 — a set of two texts, including a sentence-insertion question.
  const passageSet = await ensureGroup({
    sectionId: reading.id, type: QuestionGroupType.PASSAGE_SET, part: 7, sortOrder: 8,
    stimulus: {
      directions: 'Đọc bộ văn bản rồi trả lời các câu hỏi.',
      passages: [
        { label: 'Notice', body: 'Mooringtown Library invites community groups to use the free advertising space on its notice board. ---[1]--- Space is available for up to four weeks at a time. ---[2]--- Notices must be approved in advance at the front desk. ---[3]--- All content must be suitable for public display. ---[4]---' },
        { label: 'E-mail', body: 'Hi Dana — I dropped our reading club notice at the desk this morning. They said approval takes one business day, so it should be up before the weekend. Can you print a second copy in the smaller size just in case?' }
      ]
    }
  });
  const passageQuestions = [
    { number: 147, prompt: 'What is indicated about the notice board?', key: 'A', explanation: 'Thông báo nói không gian này miễn phí.', options: abcd('It is free to use.', 'It is only for staff.', 'It is checked weekly.', 'It was recently moved.') },
    { number: 148, prompt: 'In which of the positions marked [1], [2], [3] and [4] does the following sentence best belong? “The name and telephone number of the person posting the notice must be clearly marked on the back.”', key: 'D', explanation: 'Câu này nói tiếp về yêu cầu nội dung, nên hợp nhất ở vị trí [4].', options: abcd('[1]', '[2]', '[3]', '[4]') }
  ];
  for (const [index, item] of passageQuestions.entries()) {
    add(await ensureQuestion({ groupId: passageSet.id, numberInTest: item.number, kind: QuestionKind.READING, part: 7, level: 3, order: index + 1, prompt: item.prompt, answerKey: item.key, explanation: item.explanation, options: item.options }), reading.id);
  }

  await Promise.all(items.map((item, index) => prisma.mockTestQuestion.upsert({
    where: { testId_questionId: { testId: test.id, questionId: item.id } },
    update: { sortOrder: index + 1, sectionId: item.sectionId },
    create: { testId: test.id, questionId: item.id, sortOrder: index + 1, sectionId: item.sectionId }
  })));

  // A raw-to-scaled table for this form, so results report a real conversion, not an estimate.
  const listeningTotal = items.filter((item) => item.sectionId === listening.id).length;
  const readingTotal = items.length - listeningTotal;
  const table = (section: ExamSectionKind, total: number, top: number) =>
    Array.from({ length: total + 1 }, (_, raw) => ({ section, rawCorrect: raw, scaled: Math.max(5, Math.round((5 + (raw / Math.max(total, 1)) * (top - 5)) / 5) * 5) }));
  const rows = [...table(ExamSectionKind.LISTENING, listeningTotal, 495), ...table(ExamSectionKind.READING, readingTotal, 470)];
  await Promise.all(rows.map((row) => prisma.scoreConversion.upsert({
    where: { testId_section_rawCorrect: { testId: test.id, section: row.section, rawCorrect: row.rawCorrect } },
    update: { scaled: row.scaled },
    create: { testId: test.id, section: row.section, rawCorrect: row.rawCorrect, scaled: row.scaled }
  })));

  return { test, questionCount: items.length };
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
  const formatted = await ensureFormattedMockTest();

  const credit = await prisma.aiCreditLedger.findFirst({ where: { userId: learner.id, type: CreditEntryType.GRANT } });
  if (!credit) await prisma.aiCreditLedger.create({ data: { userId: learner.id, type: CreditEntryType.GRANT, amount: 5, balanceAfter: 5, metadata: { purpose: 'seed' } } });
  const post = await prisma.post.findFirst({ where: { authorId: learner.id, content: { contains: 'dictation' } } });
  if (!post) await prisma.post.create({ data: { authorId: learner.id, type: 'QUESTION', content: 'Mình đang luyện dictation mỗi tối, có mẹo nào để nhớ nối âm tốt hơn không?', tags: ['Listening', 'Dictation'] } });
  await prisma.auditLog.create({ data: { actorId: admin.id, action: 'SEED_COMPLETED', entity: 'System', metadata: { listeningContentId: listening.id, learnerId: learner.id } } });
  const publishedContent = await prisma.contentItem.count({ where: { status: ContentStatus.PUBLISHED } });
  console.log(`Seed complete. Admin: ${admin.email}; learner: ${learner.email}; published content: ${publishedContent}; full-format test: ${formatted.questionCount} questions across 2 sections.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
