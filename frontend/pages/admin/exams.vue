<script setup lang="ts">
import type { ExamSectionKind, QuestionGroupType } from '~/utils/exam';
import { sectionLabel } from '~/utils/exam';
import { groupTypeOption, groupTypeOptions, parseConversionTable, questionKindForPart, serialiseConversionTable } from '~/utils/exam-builder';
import { formatDateTime } from '~/utils/admin';

definePageMeta({ layout: 'admin' });

type MediaAsset = { id: string; originalName: string; mimeType: string; status: string; visibility: 'public' | 'private' };
type TestRow = { id: string; slug: string; title: string; durationMin: number; status: string; updatedAt: string; questionCount: number; conversionCount: number; sections: Array<{ id: string; kind: ExamSectionKind; label: string; durationMin: number; sortOrder: number }> };
type GroupQuestion = { id: string; kind: string; prompt: Record<string, unknown>; answerKey: string | null; numberInTest: number | null; optionsHidden: boolean; options: Array<{ key: string; text: Record<string, unknown> }> };
type GroupMedia = { assetId: string; role: string; caption: string | null; sortOrder: number; asset: { originalName: string; mimeType: string; status: string; visibility: string } };
type Group = { id: string; type: QuestionGroupType; part: number; sortOrder: number; stimulus: Record<string, unknown>; transcript: string | null; audioAssetId: string | null; audioStartSec: number | null; audioEndSec: number | null; media: GroupMedia[]; questions: GroupQuestion[] };
type Section = { id: string; kind: ExamSectionKind; label: string; durationMin: number; sortOrder: number; groups: Group[] };
type TestDetail = { id: string; slug: string; title: string; durationMin: number; status: string; sections: Section[]; conversions: Array<{ section: ExamSectionKind; rawCorrect: number; scaled: number }> };

const { request } = useAppApi();
const { canAccess, ensureConsole } = useAdminConsole();
const toast = useToast();
const { confirm } = useConfirm();

const tests = ref<TestRow[]>([]);
const detail = ref<TestDetail | null>(null);
const assets = ref<MediaAsset[]>([]);
const listLoading = ref(false);
const detailLoading = ref(false);
const busy = ref(false);

const selectedGroupId = ref('');
const conversionText = ref('');

const draftTest = reactive({ title: '', slug: '', durationMin: 120 });
const draftSection = reactive({ kind: 'LISTENING' as ExamSectionKind, label: 'Listening', durationMin: 45 });
const draftGroup = reactive({ sectionId: '', type: 'PHOTO' as QuestionGroupType });
const draftQuestion = reactive({ prompt: '', numberInTest: null as number | null, answerKey: 'A', explanation: '', options: ['', '', '', ''] });

const selectedGroup = computed(() => detail.value?.sections.flatMap((section) => section.groups).find((group) => group.id === selectedGroupId.value) ?? null);
const selectedGroupSpec = computed(() => selectedGroup.value ? groupTypeOption(selectedGroup.value.type) : null);
const imageAssets = computed(() => assets.value.filter((asset) => asset.status === 'READY' && asset.visibility === 'public' && asset.mimeType.startsWith('image/')));
const audioAssets = computed(() => assets.value.filter((asset) => asset.status === 'READY' && asset.visibility === 'public' && asset.mimeType.startsWith('audio/')));
const questionTotal = computed(() => detail.value?.sections.reduce((total, section) => total + section.groups.reduce((count, group) => count + group.questions.length, 0), 0) ?? 0);
const conversionCheck = computed(() => parseConversionTable(conversionText.value));

const groupEdit = reactive({ directions: '', photoCaption: '', transcript: '', audioAssetId: '', audioStartSec: '' as string | number, audioEndSec: '' as string | number, passages: [] as Array<{ label: string; body: string }> });
const mediaPick = reactive({ assetId: '', caption: '' });

const promptText = (value: Record<string, unknown>) => typeof value?.text === 'string' ? value.text : '';

async function loadTests() {
  if (!canAccess.value) return;
  listLoading.value = true;
  try { tests.value = await request<TestRow[]>('/admin/exams'); }
  catch { toast.error('Không tải được kho đề', 'Cần quyền content editor hoặc admin.'); }
  finally { listLoading.value = false; }
}

async function loadAssets() {
  if (!canAccess.value) return;
  try { assets.value = await request<MediaAsset[]>('/admin/media', { query: { page: 1, pageSize: 100 } }); }
  catch { assets.value = []; }
}

async function openTest(testId: string) {
  detailLoading.value = true;
  selectedGroupId.value = '';
  try {
    detail.value = await request<TestDetail>(`/admin/exams/${testId}`);
    conversionText.value = serialiseConversionTable(detail.value.conversions);
    draftGroup.sectionId = detail.value.sections[0]?.id ?? '';
  } catch { toast.error('Không mở được đề', 'Hãy tải lại danh sách rồi thử lại.'); }
  finally { detailLoading.value = false; }
}

function selectGroup(group: Group) {
  selectedGroupId.value = group.id;
  const stimulus = group.stimulus ?? {};
  groupEdit.directions = typeof stimulus.directions === 'string' ? stimulus.directions : '';
  groupEdit.photoCaption = typeof stimulus.photoCaption === 'string' ? stimulus.photoCaption : '';
  groupEdit.passages = Array.isArray(stimulus.passages)
    ? (stimulus.passages as Array<Record<string, unknown>>).map((passage) => ({ label: typeof passage.label === 'string' ? passage.label : '', body: typeof passage.body === 'string' ? passage.body : '' }))
    : [];
  groupEdit.transcript = group.transcript ?? '';
  groupEdit.audioAssetId = group.audioAssetId ?? '';
  groupEdit.audioStartSec = group.audioStartSec ?? '';
  groupEdit.audioEndSec = group.audioEndSec ?? '';
  mediaPick.assetId = '';
  mediaPick.caption = '';
  resetQuestionDraft(group);
}

function resetQuestionDraft(group: Group) {
  const spec = groupTypeOption(group.type);
  draftQuestion.prompt = '';
  draftQuestion.numberInTest = null;
  draftQuestion.answerKey = spec.optionKeys[0];
  draftQuestion.explanation = '';
  draftQuestion.options = spec.optionKeys.map(() => '');
}

async function createTest() {
  if (!draftTest.title.trim() || !draftTest.slug.trim() || busy.value) return;
  busy.value = true;
  try {
    const created = await request<TestRow>('/admin/exams', { method: 'POST', body: { title: draftTest.title.trim(), slug: draftTest.slug.trim(), durationMin: draftTest.durationMin } });
    draftTest.title = '';
    draftTest.slug = '';
    toast.success('Đã tạo đề', 'Thêm section rồi dựng nhóm câu hỏi bên trong.');
    await loadTests();
    await openTest(created.id);
  } catch { toast.error('Chưa tạo được đề', 'Kiểm tra slug — mỗi đề cần một slug riêng.'); }
  finally { busy.value = false; }
}

async function addSection() {
  if (!detail.value || busy.value) return;
  busy.value = true;
  try {
    await request(`/admin/exams/${detail.value.id}/sections`, { method: 'POST', body: { kind: draftSection.kind, label: draftSection.label.trim(), durationMin: draftSection.durationMin } });
    toast.success('Đã thêm section', `${sectionLabel(draftSection.kind)} · ${draftSection.durationMin} phút.`);
    await Promise.all([openTest(detail.value.id), loadTests()]);
  } catch { toast.error('Chưa thêm được section', 'Kiểm tra nhãn và thời lượng rồi thử lại.'); }
  finally { busy.value = false; }
}

async function addGroup() {
  if (!detail.value || !draftGroup.sectionId || busy.value) return;
  const spec = groupTypeOption(draftGroup.type);
  busy.value = true;
  try {
    await request(`/admin/exams/${detail.value.id}/groups`, { method: 'POST', body: { sectionId: draftGroup.sectionId, type: spec.value, part: spec.part, stimulus: {} } });
    toast.success('Đã thêm nhóm', `${spec.label} — mở nhóm để nhập tài liệu và câu hỏi.`);
    await openTest(detail.value.id);
  } catch { toast.error('Chưa thêm được nhóm', 'Section phải thuộc chính đề này.'); }
  finally { busy.value = false; }
}

async function saveGroup() {
  if (!selectedGroup.value || busy.value) return;
  busy.value = true;
  try {
    const stimulus: Record<string, unknown> = {};
    if (groupEdit.directions.trim()) stimulus.directions = groupEdit.directions.trim();
    if (groupEdit.photoCaption.trim()) stimulus.photoCaption = groupEdit.photoCaption.trim();
    const passages = groupEdit.passages.filter((passage) => passage.body.trim());
    if (passages.length) stimulus.passages = passages.map((passage) => ({ label: passage.label.trim() || undefined, body: passage.body.trim() }));
    await request(`/admin/exams/groups/${selectedGroup.value.id}`, {
      method: 'PATCH',
      body: {
        stimulus,
        transcript: groupEdit.transcript,
        audioAssetId: groupEdit.audioAssetId || null,
        audioStartSec: groupEdit.audioStartSec === '' ? null : Number(groupEdit.audioStartSec),
        audioEndSec: groupEdit.audioEndSec === '' ? null : Number(groupEdit.audioEndSec)
      }
    });
    toast.success('Đã lưu nhóm', 'Tài liệu và audio của nhóm đã được cập nhật.');
    await openTest(detail.value!.id);
    selectedGroupId.value = selectedGroup.value?.id ?? selectedGroupId.value;
  } catch { toast.error('Chưa lưu được nhóm', 'Audio phải là asset READY và đã cho phép phát công khai.'); }
  finally { busy.value = false; }
}

async function attachMedia() {
  if (!selectedGroup.value || !mediaPick.assetId || busy.value) return;
  const groupId = selectedGroup.value.id;
  busy.value = true;
  try {
    await request(`/admin/exams/groups/${groupId}/media`, { method: 'POST', body: { assetId: mediaPick.assetId, role: selectedGroup.value.part === 1 ? 'photo' : 'graphic', caption: mediaPick.caption.trim() || undefined } });
    mediaPick.assetId = '';
    mediaPick.caption = '';
    toast.success('Đã gắn ảnh vào nhóm', 'Learner sẽ thấy ảnh này cạnh câu hỏi của nhóm.');
    await openTest(detail.value!.id);
    selectedGroupId.value = groupId;
  } catch { toast.error('Chưa gắn được ảnh', 'Chỉ Part 1, 3, 4 nhận ảnh và asset phải READY + công khai.'); }
  finally { busy.value = false; }
}

function detachMedia(media: GroupMedia) {
  if (!selectedGroup.value) return;
  const groupId = selectedGroup.value.id;
  return confirm({
    title: 'Gỡ ảnh khỏi nhóm?',
    description: `“${media.asset.originalName}” sẽ không còn hiển thị cạnh câu hỏi. File vẫn nằm trong media library.`,
    confirmLabel: 'Gỡ ảnh',
    cancelLabel: 'Giữ lại',
    tone: 'danger'
  }, async () => {
    try {
      await request(`/admin/exams/groups/${groupId}/media/${media.assetId}`, { method: 'DELETE' });
      toast.success('Đã gỡ ảnh khỏi nhóm');
      await openTest(detail.value!.id);
      selectedGroupId.value = groupId;
    } catch { toast.error('Chưa gỡ được ảnh', 'Hãy tải lại đề rồi thử lại.'); }
  });
}

async function addQuestion() {
  if (!selectedGroup.value || busy.value) return;
  const group = selectedGroup.value;
  const spec = groupTypeOption(group.type);
  const options = spec.optionKeys.map((key, position) => ({ key, text: draftQuestion.options[position]?.trim() ?? '' }));
  if (!draftQuestion.prompt.trim()) { toast.error('Thiếu đề bài', 'Nhập nội dung câu hỏi trước khi lưu.'); return; }
  if (options.some((option) => !option.text)) { toast.error('Thiếu lựa chọn', `Nhóm này cần đủ ${spec.optionKeys.length} phương án.`); return; }
  busy.value = true;
  try {
    await request(`/admin/exams/groups/${group.id}/questions`, {
      method: 'POST',
      body: {
        kind: questionKindForPart(group.part),
        prompt: draftQuestion.prompt.trim(),
        answerKey: draftQuestion.answerKey,
        explanation: draftQuestion.explanation.trim() || undefined,
        numberInTest: draftQuestion.numberInTest ?? undefined,
        optionsHidden: spec.hidesOptions,
        options
      }
    });
    toast.success('Đã thêm câu hỏi', 'Câu này đã được đưa vào đề cùng section của nhóm.');
    await Promise.all([openTest(detail.value!.id), loadTests()]);
    selectedGroupId.value = group.id;
    resetQuestionDraft(group);
  } catch { toast.error('Chưa thêm được câu hỏi', 'Đáp án đúng phải nằm trong danh sách phương án.'); }
  finally { busy.value = false; }
}

async function saveConversions() {
  if (!detail.value || busy.value) return;
  const parsed = conversionCheck.value;
  if (parsed.errors.length) { toast.error('Bảng quy đổi có lỗi', parsed.errors[0]); return; }
  busy.value = true;
  try {
    await request(`/admin/exams/${detail.value.id}/conversions`, { method: 'PUT', body: { rows: parsed.rows } });
    toast.success('Đã lưu bảng quy đổi', `${parsed.rows.length} dòng. Kết quả sẽ dùng bảng này thay cho ước lượng.`);
    await Promise.all([openTest(detail.value.id), loadTests()]);
  } catch { toast.error('Chưa lưu được bảng quy đổi', 'Kiểm tra dòng trùng section và số câu đúng.'); }
  finally { busy.value = false; }
}

function publish() {
  if (!detail.value) return;
  const test = detail.value;
  return confirm({
    title: `Publish “${test.title}”?`,
    description: `${questionTotal.value} câu sẽ hiển thị trong kho đề của người học. Bạn vẫn sửa được sau khi publish.`,
    confirmLabel: 'Publish đề',
    cancelLabel: 'Chưa publish'
  }, async () => {
    try {
      await request(`/admin/exams/${test.id}/publish`, { method: 'POST' });
      toast.success('Đã publish đề', 'Người học thấy đề này trong kho ngay bây giờ.');
      await Promise.all([openTest(test.id), loadTests()]);
    } catch { toast.error('Chưa publish được', 'Đề cần có ít nhất một câu hỏi.'); }
  });
}

onMounted(async () => { await ensureConsole(); await Promise.all([loadTests(), loadAssets()]); });
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      eyebrow="Dựng đề theo section"
      title="Đề thi"
      description="Một đề TOEIC là section → nhóm → câu hỏi. Nhóm giữ tài liệu dùng chung (tranh, hội thoại, bộ văn bản); câu hỏi treo vào nhóm và tự vào đúng section."
    >
      <template #aside>
        <div class="flex gap-2">
          <span class="rounded-2xl bg-mint px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Đề</span><span class="mt-0.5 block text-lg font-black">{{ tests.length }}</span></span>
          <span class="rounded-2xl bg-azure px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Ảnh dùng được</span><span class="mt-0.5 block text-lg font-black text-[#1288C8]">{{ imageAssets.length }}</span></span>
        </div>
      </template>
    </AdminPageHeader>

    <div class="grid gap-5 lg:grid-cols-[.65fr_1.35fr] lg:items-start">
      <!-- Test list -->
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex items-end justify-between gap-3">
          <div><p class="text-xs font-extrabold text-ink/45">KHO ĐỀ</p><h2 class="mt-1 text-xl font-extrabold">{{ tests.length }} đề</h2></div>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="listLoading" @click="loadTests">{{ listLoading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>

        <ul v-if="tests.length" class="mt-4 space-y-2">
          <li v-for="row in tests" :key="row.id">
            <button :class="['w-full rounded-2xl border p-3.5 text-left transition focus-ring', detail?.id === row.id ? 'border-iris bg-azure' : 'border-line hover:bg-mint']" @click="openTest(row.id)">
              <div class="flex items-start justify-between gap-2">
                <span class="text-sm font-extrabold">{{ row.title }}</span>
                <span :class="['shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-extrabold', row.status === 'PUBLISHED' ? 'bg-mint text-[#46A900]' : 'bg-sun text-[#A87400]']">{{ row.status }}</span>
              </div>
              <p class="mt-1.5 text-[11px] text-ink/45">{{ row.questionCount }} câu · {{ row.sections.length }} section · {{ row.conversionCount ? 'có bảng quy đổi' : 'chưa có bảng quy đổi' }}</p>
              <p class="mt-1 text-[11px] text-ink/35">{{ row.slug }} · {{ formatDateTime(row.updatedAt) }}</p>
            </button>
          </li>
        </ul>
        <p v-else-if="listLoading" class="mt-4 rounded-2xl bg-mint p-5 text-xs text-ink/55">Đang tải kho đề…</p>
        <p v-else class="mt-4 rounded-2xl bg-mint p-5 text-xs leading-5 text-ink/55">Chưa có đề nào. Tạo đề đầu tiên bên dưới.</p>

        <div class="mt-6 border-t border-line pt-5">
          <p class="text-xs font-extrabold text-ink/45">TẠO ĐỀ MỚI</p>
          <div class="mt-4 space-y-3">
            <AppInput v-model="draftTest.title" placeholder="Tên đề" aria-label="Tên đề" />
            <AppInput v-model="draftTest.slug" placeholder="slug-de-thi" aria-label="Slug" />
            <AppInput v-model.number="draftTest.durationMin" type="number" min="1" max="600" aria-label="Tổng thời gian (phút)" />
            <button class="cta-grass w-full px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="busy || !draftTest.title.trim() || !draftTest.slug.trim()" @click="createTest">Tạo đề</button>
          </div>
        </div>
      </section>

      <!-- Selected test -->
      <section class="min-w-0 space-y-5">
        <div v-if="!detail" class="rounded-[22px] border border-line p-8">
          <p class="text-sm font-extrabold">{{ detailLoading ? 'Đang mở đề…' : 'Chọn một đề để dựng' }}</p>
          <p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Mỗi đề bắt đầu bằng section — Nghe và Đọc được tính giờ riêng — rồi mới tới nhóm câu hỏi bên trong.</p>
        </div>

        <template v-else>
          <div class="rounded-[22px] border border-line p-5 sm:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-extrabold text-ink/45">ĐANG DỰNG</p>
                <h2 class="mt-1 text-xl font-extrabold">{{ detail.title }}</h2>
                <p class="mt-1 text-[11px] text-ink/45">{{ detail.slug }} · {{ questionTotal }} câu · {{ detail.conversions.length }} dòng quy đổi</p>
              </div>
              <button class="cta-grass px-4 py-2.5 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="busy || !questionTotal" @click="publish">{{ detail.status === 'PUBLISHED' ? 'Publish lại' : 'Publish đề' }}</button>
            </div>

            <div class="mt-5 flex flex-wrap items-end gap-2 border-t border-line pt-5">
              <AppSelect v-model="draftSection.kind" class="w-full sm:w-auto" aria-label="Loại section">
                <option value="LISTENING">Listening</option>
                <option value="READING">Reading</option>
              </AppSelect>
              <AppInput v-model="draftSection.label" class="min-w-[140px] flex-1" placeholder="Nhãn section" aria-label="Nhãn section" />
              <AppInput v-model.number="draftSection.durationMin" class="w-full sm:w-28" type="number" min="1" max="300" aria-label="Phút" />
              <button class="cta-sky px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="busy || !draftSection.label.trim()" @click="addSection">Thêm section</button>
            </div>
          </div>

          <!-- Section tree -->
          <div v-for="section in detail.sections" :key="section.id" class="rounded-[22px] border border-line p-5 sm:p-6">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-xs font-extrabold text-iris">{{ sectionLabel(section.kind) }}</p>
                <h3 class="mt-1 text-lg font-extrabold">{{ section.label }} · {{ section.durationMin }} phút</h3>
              </div>
              <span class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ section.groups.length }} nhóm</span>
            </div>

            <ul v-if="section.groups.length" class="mt-4 space-y-2">
              <li v-for="group in section.groups" :key="group.id">
                <button :class="['w-full rounded-2xl border p-3.5 text-left transition focus-ring', selectedGroupId === group.id ? 'border-iris bg-azure' : 'border-line hover:bg-mint']" @click="selectGroup(group)">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-sm font-extrabold">{{ groupTypeOption(group.type).label }}</span>
                    <span class="flex gap-1.5">
                      <span class="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-ink/55">{{ group.questions.length }} câu</span>
                      <span v-if="group.media.length" class="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-ink/55">{{ group.media.length }} ảnh</span>
                      <span v-if="group.audioAssetId" class="rounded-lg bg-white px-2 py-0.5 text-[10px] font-bold text-ink/55">audio</span>
                    </span>
                  </div>
                  <p v-if="group.questions.length" class="mt-1.5 truncate text-[11px] text-ink/45">Câu {{ group.questions.map((question) => question.numberInTest ?? '?').join(', ') }}</p>
                </button>
              </li>
            </ul>
            <p v-else class="mt-4 rounded-2xl bg-mint p-4 text-xs text-ink/55">Section này chưa có nhóm nào.</p>

            <div class="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
              <AppSelect v-model="draftGroup.type" class="min-w-[220px] flex-1" aria-label="Dạng nhóm">
                <option v-for="option in groupTypeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </AppSelect>
              <button class="cta-sky px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="busy" @click="draftGroup.sectionId = section.id; addGroup()">Thêm nhóm vào {{ sectionLabel(section.kind) }}</button>
            </div>
          </div>

          <p v-if="!detail.sections.length" class="rounded-[22px] bg-mint p-5 text-xs leading-5 text-ink/55">Đề chưa có section. Thêm Listening và Reading để bắt đầu — mỗi phần có thời gian riêng.</p>

          <!-- Group inspector -->
          <div v-if="selectedGroup && selectedGroupSpec" class="rounded-[22px] border border-line p-5 sm:p-6">
            <p class="text-xs font-extrabold text-ink/45">NHÓM ĐANG MỞ</p>
            <h3 class="mt-1 text-lg font-extrabold">{{ selectedGroupSpec.label }}</h3>
            <p v-if="selectedGroupSpec.hidesOptions" class="mt-2 rounded-xl bg-sun p-3 text-xs leading-5 text-[#8B6400]">Part này không in phương án ra giấy. Câu hỏi thêm vào đây sẽ tự bật chế độ chỉ hiện chữ cái, và cần đủ {{ selectedGroupSpec.optionKeys.length }} phương án để phát trong audio.</p>

            <div class="mt-5 grid gap-5 xl:grid-cols-2">
              <!-- Stimulus -->
              <div class="space-y-3">
                <p class="text-xs font-extrabold text-ink/45">TÀI LIỆU CỦA NHÓM</p>
                <AppInput v-model="groupEdit.directions" placeholder="Hướng dẫn hiển thị cho người học" aria-label="Hướng dẫn" />
                <AppInput v-if="selectedGroup.part === 1" v-model="groupEdit.photoCaption" placeholder="Mô tả tranh (hiển thị khi chưa gắn ảnh)" aria-label="Mô tả tranh" />

                <div v-for="(passage, position) in groupEdit.passages" :key="position" class="rounded-2xl bg-mint p-3">
                  <div class="flex items-center gap-2">
                    <AppInput v-model="passage.label" class="flex-1" placeholder="Nhãn văn bản (E-mail, Notice…)" :aria-label="`Nhãn văn bản ${position + 1}`" />
                    <button class="rounded-lg px-2 py-1 text-[11px] font-extrabold text-[#B5473A] hover:bg-blush focus-ring" @click="groupEdit.passages.splice(position, 1)">Xoá</button>
                  </div>
                  <textarea v-model="passage.body" rows="4" class="mt-2 w-full rounded-xl border border-line px-3 py-2 text-xs leading-6 outline-none" :aria-label="`Nội dung văn bản ${position + 1}`" />
                </div>
                <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" @click="groupEdit.passages.push({ label: '', body: '' })">Thêm văn bản</button>

                <label class="block text-xs font-extrabold text-ink/45" for="group-transcript">TRANSCRIPT</label>
                <textarea id="group-transcript" v-model="groupEdit.transcript" rows="4" class="w-full rounded-2xl border border-line px-4 py-3 text-xs leading-6 outline-none" placeholder="(W-Am) … (M-Cn) …" />
              </div>

              <!-- Audio + media -->
              <div class="space-y-3">
                <p class="text-xs font-extrabold text-ink/45">AUDIO</p>
                <AppSelect v-model="groupEdit.audioAssetId" class="w-full" aria-label="Chọn audio cho nhóm">
                  <option value="">Không gắn audio</option>
                  <option v-for="asset in audioAssets" :key="asset.id" :value="asset.id">{{ asset.originalName }}</option>
                </AppSelect>
                <div class="flex gap-2">
                  <AppInput v-model="groupEdit.audioStartSec" class="flex-1" type="number" min="0" placeholder="Bắt đầu (giây)" aria-label="Giây bắt đầu" />
                  <AppInput v-model="groupEdit.audioEndSec" class="flex-1" type="number" min="0" placeholder="Kết thúc (giây)" aria-label="Giây kết thúc" />
                </div>
                <p class="text-[11px] leading-5 text-ink/45">Mốc thời gian cho phép một file dài phục vụ nhiều nhóm, thay vì phải cắt sẵn từng đoạn.</p>

                <template v-if="selectedGroupSpec.takesMedia">
                  <p class="pt-2 text-xs font-extrabold text-ink/45">ẢNH VÀ BIỂU ĐỒ</p>
                  <ul v-if="selectedGroup.media.length" class="space-y-2">
                    <li v-for="media in selectedGroup.media" :key="media.assetId" class="flex items-center justify-between gap-2 rounded-2xl bg-mint p-3">
                      <span class="min-w-0">
                        <span class="block truncate text-xs font-extrabold">{{ media.asset.originalName }}</span>
                        <span class="block text-[11px] text-ink/45">{{ media.role }}<span v-if="media.caption"> · {{ media.caption }}</span></span>
                      </span>
                      <button class="shrink-0 rounded-lg px-2 py-1 text-[11px] font-extrabold text-[#B5473A] hover:bg-blush focus-ring" @click="detachMedia(media)">Gỡ</button>
                    </li>
                  </ul>
                  <p v-else class="rounded-2xl bg-mint p-3 text-[11px] leading-5 text-ink/55">Chưa gắn ảnh nào. Part 1 cần một ảnh cho mỗi nhóm; Part 3 và 4 dùng ảnh cho câu hỏi nhìn biểu đồ.</p>

                  <AppSelect v-model="mediaPick.assetId" class="w-full" aria-label="Chọn ảnh để gắn">
                    <option value="">Chọn ảnh đã công khai…</option>
                    <option v-for="asset in imageAssets" :key="asset.id" :value="asset.id">{{ asset.originalName }}</option>
                  </AppSelect>
                  <AppInput v-model="mediaPick.caption" placeholder="Chú thích (tuỳ chọn)" aria-label="Chú thích ảnh" />
                  <button class="cta-sky w-full px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="busy || !mediaPick.assetId" @click="attachMedia">Gắn ảnh vào nhóm</button>
                  <p v-if="!imageAssets.length" class="text-[11px] leading-5 text-[#A87400]">Chưa có ảnh nào READY và công khai. Upload ở màn Media rồi bấm “Cho phép phát”.</p>
                </template>
              </div>
            </div>

            <button class="cta-grass mt-5 px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="busy" @click="saveGroup">Lưu tài liệu nhóm</button>

            <!-- Questions in this group -->
            <div class="mt-7 border-t border-line pt-5">
              <p class="text-xs font-extrabold text-ink/45">CÂU HỎI TRONG NHÓM</p>
              <ol v-if="selectedGroup.questions.length" class="mt-3 space-y-2">
                <li v-for="question in selectedGroup.questions" :key="question.id" class="rounded-2xl bg-mint p-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="text-xs font-extrabold">Câu {{ question.numberInTest ?? '—' }}</span>
                    <span class="flex gap-1.5">
                      <span class="rounded-lg bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#46A900]">Đáp án {{ question.answerKey }}</span>
                      <span v-if="question.optionsHidden" class="rounded-lg bg-white px-2 py-0.5 text-[10px] font-extrabold text-ink/55">ẩn phương án</span>
                    </span>
                  </div>
                  <p class="mt-1.5 text-xs leading-5 text-ink/60">{{ promptText(question.prompt) }}</p>
                </li>
              </ol>
              <p v-else class="mt-3 rounded-2xl bg-mint p-4 text-xs text-ink/55">Nhóm này chưa có câu hỏi nào.</p>

              <div class="mt-5 space-y-3 rounded-2xl border border-line p-4">
                <p class="text-xs font-extrabold text-ink/45">THÊM CÂU HỎI</p>
                <textarea v-model="draftQuestion.prompt" rows="2" class="w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none" placeholder="Đề bài — với Part 1 và 2 hãy ghi hướng dẫn nghe" aria-label="Đề bài" />
                <div class="grid gap-2 sm:grid-cols-2">
                  <div v-for="(key, position) in selectedGroupSpec.optionKeys" :key="key" class="flex items-center gap-2">
                    <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mint text-xs font-extrabold text-ink/60">{{ key }}</span>
                    <AppInput v-model="draftQuestion.options[position]" class="flex-1" :placeholder="`Phương án ${key}`" :aria-label="`Phương án ${key}`" />
                  </div>
                </div>
                <div class="flex flex-wrap items-end gap-2">
                  <AppSelect v-model="draftQuestion.answerKey" class="w-full sm:w-32" aria-label="Đáp án đúng">
                    <option v-for="key in selectedGroupSpec.optionKeys" :key="key" :value="key">Đáp án {{ key }}</option>
                  </AppSelect>
                  <AppInput v-model.number="draftQuestion.numberInTest" class="w-full sm:w-32" type="number" min="1" max="400" placeholder="Số câu" aria-label="Số câu trong đề" />
                  <AppInput v-model="draftQuestion.explanation" class="min-w-[160px] flex-1" placeholder="Giải thích (tuỳ chọn)" aria-label="Giải thích" />
                </div>
                <button class="cta-grass w-full px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="busy" @click="addQuestion">Thêm câu hỏi vào nhóm</button>
              </div>
            </div>
          </div>

          <!-- Score conversion -->
          <div class="rounded-[22px] border border-line p-5 sm:p-6">
            <p class="text-xs font-extrabold text-ink/45">BẢNG QUY ĐỔI ĐIỂM</p>
            <h3 class="mt-1 text-lg font-extrabold">Raw → thang điểm từng section</h3>
            <p class="mt-2 max-w-2xl text-xs leading-5 text-ink/55">Mỗi dòng một mức: <code class="rounded bg-mint px-1.5 py-0.5">LISTENING,42,320</code>. Khi chưa có bảng, kết quả chỉ là ước lượng và giao diện nói rõ điều đó.</p>
            <textarea v-model="conversionText" rows="8" class="mt-4 w-full rounded-2xl border border-line px-4 py-3 font-mono text-xs leading-6 outline-none" aria-label="Bảng quy đổi điểm" placeholder="LISTENING,0,5&#10;LISTENING,1,15&#10;READING,0,5" />
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <button class="cta-grass px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="busy || Boolean(conversionCheck.errors.length)" @click="saveConversions">Lưu bảng quy đổi</button>
              <span v-if="conversionCheck.errors.length" class="text-xs font-bold text-[#B5473A]">{{ conversionCheck.errors[0] }}</span>
              <span v-else class="text-xs text-ink/55">{{ conversionCheck.rows.length }} dòng hợp lệ.</span>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>
