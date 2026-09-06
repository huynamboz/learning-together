<script setup lang="ts">
import type { ExamResultPayload, ExamSection, QuestionGroup } from '~/utils/exam';
import { directionsOf, groupLabel, passagesOf, photoCaptionOf, scoreCaption, sectionLabel } from '~/utils/exam';

type JsonText = { text?: string };
type CatalogTest = { id: string; slug: string; title: string; durationMin: number; questionCount: number; hasScoreTable: boolean; sections: Array<{ id: string; kind: 'LISTENING' | 'READING'; label: string; durationMin: number }> };
type ExamQuestion = {
  id: string;
  prompt: JsonText;
  part: number | null;
  numberInTest: number | null;
  optionsHidden: boolean;
  groupId: string | null;
  sectionId: string | null;
  options: Array<{ key: string; text: JsonText }>;
};
type ExamSessionPayload = { sessionId: string; mode: string; durationMin: number; sections: ExamSection[]; groups: QuestionGroup[]; questions: ExamQuestion[] };

const route = useRoute();
const config = useRuntimeConfig();
const { request, accessToken } = useAppApi();
const toast = useToast();
const { confirm } = useConfirm();

const testId = computed(() => String(route.params.id));
const mode = computed<'practice' | 'exam'>(() => route.params.mode === 'exam' ? 'exam' : 'practice');

const test = ref<CatalogTest | null>(null);
const session = ref<ExamSessionPayload | null>(null);
const result = ref<ExamResultPayload | null>(null);
const answers = ref<Record<string, string>>({});
const index = ref(0);
const seconds = ref(0);
const starting = ref(false);
const submitting = ref(false);
const loading = ref(true);
let timer: ReturnType<typeof setInterval> | undefined;

const questions = computed(() => session.value?.questions ?? []);
const current = computed(() => questions.value[index.value] ?? null);
const answered = computed(() => Object.keys(answers.value).length);
const clock = computed(() => `${String(Math.floor(seconds.value / 60)).padStart(2, '0')}:${String(seconds.value % 60).padStart(2, '0')}`);
const modeLabel = computed(() => mode.value === 'exam' ? 'Thi thử' : 'Luyện tập');

const groupById = computed(() => new Map((session.value?.groups ?? []).map((group) => [group.id, group])));
const sectionById = computed(() => new Map((session.value?.sections ?? []).map((section) => [section.id, section])));
const currentGroup = computed(() => current.value?.groupId ? groupById.value.get(current.value.groupId) : undefined);
const currentSection = computed(() => current.value?.sectionId ? sectionById.value.get(current.value.sectionId) : undefined);

/** Questions sharing a stimulus are answered together, so the runner shows the set's position. */
const groupPeers = computed(() => current.value?.groupId ? questions.value.filter((question) => question.groupId === current.value?.groupId) : []);
const positionInGroup = computed(() => current.value ? groupPeers.value.findIndex((question) => question.id === current.value?.id) + 1 : 0);

const groupAudioUrl = computed(() => currentGroup.value?.audioAssetId ? `${config.public.apiBase}/media/${currentGroup.value.audioAssetId}/file` : '');
const caption = computed(() => result.value ? scoreCaption(result.value.scoreSource) : null);

function textOf(value: JsonText | undefined) { return typeof value?.text === 'string' ? value.text : ''; }

async function loadTest() {
  loading.value = true;
  try {
    const catalog = await request<CatalogTest[]>('/mock-tests');
    test.value = catalog.find((item) => item.id === testId.value) ?? null;
  } catch { test.value = null; }
  finally { loading.value = false; }
}

function stopTimer() { if (timer) { clearInterval(timer); timer = undefined; } }

async function start() {
  if (!accessToken.value) { toast.info('Đăng nhập để bắt đầu', 'Phiên làm bài được lưu theo tài khoản của bạn.'); return; }
  starting.value = true;
  try {
    session.value = await request<ExamSessionPayload>('/exam-sessions', { method: 'POST', body: { testId: testId.value, mode: mode.value } });
    seconds.value = (session.value.durationMin ?? test.value?.durationMin ?? 10) * 60;
    index.value = 0;
    answers.value = {};
    result.value = null;
    if (mode.value === 'exam') timer = setInterval(() => { if (seconds.value > 0) seconds.value -= 1; else void submit(true); }, 1000);
  } catch { toast.error('Không tạo được phiên làm bài', 'Kiểm tra quyền truy cập đề rồi thử lại.'); }
  finally { starting.value = false; }
}

async function saveAnswer(questionId: string, value: string) {
  answers.value = { ...answers.value, [questionId]: value };
  if (!session.value) return;
  try { await request(`/exam-sessions/${session.value.sessionId}/answers`, { method: 'PATCH', body: { questionId, selectedAnswer: value } }); }
  catch { toast.error('Câu trả lời chưa đồng bộ', 'Bạn vẫn làm tiếp được; hệ thống sẽ nhận lại khi nộp bài.'); }
}

async function submit(auto = false) {
  if (!session.value || submitting.value) return;
  const unanswered = questions.value.length - answered.value;
  if (!auto && unanswered > 0) {
    const agreed = await confirm({
      title: `Nộp bài khi còn ${unanswered} câu chưa trả lời?`,
      description: 'Câu chưa trả lời được tính là bỏ trống và không thể sửa sau khi nộp.',
      confirmLabel: 'Nộp bài',
      cancelLabel: 'Làm tiếp',
      tone: 'danger'
    });
    if (!agreed) return;
  }
  submitting.value = true;
  stopTimer();
  try {
    result.value = await request<ExamResultPayload>(`/exam-sessions/${session.value.sessionId}/submit`, { method: 'POST' });
    toast.success('Đã nộp bài', `Đúng ${result.value.correct}/${result.value.total} câu.`);
  } catch { toast.error('Chưa nộp được bài', 'Kiểm tra kết nối rồi thử lại.'); }
  finally { submitting.value = false; }
}

onMounted(loadTest);
onUnmounted(stopTimer);
</script>

<template>
  <div class="page-enter space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
      <div class="min-w-0">
        <NuxtLink to="/mock-test" class="inline-flex items-center gap-1.5 text-xs font-bold text-iris hover:underline focus-ring"><AppIcon icon="solar:arrow-left-linear" :size="15" /> Kho đề</NuxtLink>
        <h1 class="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">{{ test?.title ?? (loading ? 'Đang mở đề…' : 'Không tìm thấy đề') }}</h1>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ modeLabel }}</span>
          <span v-if="test" class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ test.questionCount }} câu</span>
          <span v-for="section in test?.sections ?? []" :key="section.id" class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ sectionLabel(section.kind) }} {{ section.durationMin }}′</span>
          <span v-if="test && !test.sections.length" class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ test.durationMin }} phút</span>
        </div>
      </div>
      <div v-if="session && !result && mode === 'exam'" class="rounded-2xl bg-sun px-4 py-3 text-right">
        <p class="text-[11px] font-bold text-ink/50">Còn lại</p>
        <p class="mt-0.5 text-xl font-extrabold text-[#A87400]">{{ clock }}</p>
      </div>
      <div v-else-if="session && !result" class="rounded-2xl bg-mint px-4 py-3 text-right">
        <p class="text-[11px] font-bold text-ink/50">Đã trả lời</p>
        <p class="mt-0.5 text-xl font-extrabold">{{ answered }} / {{ questions.length }}</p>
      </div>
    </div>

    <div v-if="!loading && !test" class="rounded-[22px] border border-line p-8">
      <p class="text-sm font-extrabold">Đề này không còn được publish</p>
      <p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Quay lại kho đề để chọn một đề khác.</p>
      <NuxtLink to="/mock-test" class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Về kho đề</NuxtLink>
    </div>

    <!-- Result -->
    <section v-else-if="result" class="mx-auto max-w-2xl rounded-[22px] border border-line p-6 sm:p-9">
      <p class="text-center text-xs font-extrabold tracking-[0.18em] text-iris">KẾT QUẢ</p>

      <p v-if="result.score !== null" class="mt-5 text-center text-6xl font-extrabold tracking-[-0.08em]">{{ result.score }}</p>
      <p v-else class="mt-5 text-center text-5xl font-extrabold tracking-[-0.07em]">{{ result.correct }}<span class="text-2xl text-ink/30"> / {{ result.total }}</span></p>
      <p v-if="caption" :class="['mt-3 text-center text-xs leading-5', caption.provisional ? 'text-[#A87400]' : 'text-ink/55']">{{ caption.note }}</p>

      <div v-if="result.listeningCorrect !== null || result.readingCorrect !== null" class="mt-7 grid gap-3 sm:grid-cols-2">
        <div v-if="result.listeningCorrect !== null" class="rounded-2xl bg-mint p-4 text-center">
          <p class="text-[11px] font-extrabold text-[#46A900]">NGHE</p>
          <p class="mt-2 text-3xl font-extrabold tracking-[-0.05em]">{{ result.listeningScaled ?? '—' }}</p>
          <p class="mt-1 text-xs text-ink/55">{{ result.listeningCorrect }} câu đúng</p>
        </div>
        <div v-if="result.readingCorrect !== null" class="rounded-2xl bg-azure p-4 text-center">
          <p class="text-[11px] font-extrabold text-[#1288C8]">ĐỌC</p>
          <p class="mt-2 text-3xl font-extrabold tracking-[-0.05em]">{{ result.readingScaled ?? '—' }}</p>
          <p class="mt-1 text-xs text-ink/55">{{ result.readingCorrect }} câu đúng</p>
        </div>
      </div>

      <p class="mt-5 text-center text-sm text-ink/55">Đúng {{ result.correct }} · sai {{ result.wrong }} · bỏ trống {{ result.unanswered }}.</p>

      <div class="mt-7 flex flex-wrap justify-center gap-2">
        <NuxtLink to="/mock-test" class="cta-sky inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Chọn đề khác</NuxtLink>
        <button class="cta-grass px-4 py-3 text-xs font-extrabold focus-ring" @click="start">Làm lại đề này</button>
      </div>
    </section>

    <!-- Start screen -->
    <section v-else-if="!session" class="mx-auto max-w-2xl rounded-[22px] border border-line p-6 text-center sm:p-10">
      <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-azure text-iris"><AppIcon icon="solar:clipboard-list-bold" :size="30" /></span>
      <h2 class="mt-5 text-2xl font-extrabold tracking-[-0.04em]">Sẵn sàng cho {{ modeLabel.toLowerCase() }}?</h2>
      <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/55">
        {{ mode === 'exam' ? 'Đồng hồ chạy ngay khi bắt đầu và bài tự nộp khi hết giờ.' : 'Không có đồng hồ đếm ngược — tập trung vào việc hiểu vì sao một đáp án đúng.' }}
      </p>
      <p v-if="test && !test.hasScoreTable" class="mx-auto mt-3 max-w-md text-xs leading-5 text-[#A87400]">Đề này chưa có bảng quy đổi riêng, nên điểm cuối bài chỉ là ước lượng.</p>
      <AppButton class="mt-7" :loading="starting" @click="start">{{ starting ? 'Đang tạo phiên…' : 'Bắt đầu' }}</AppButton>
      <p v-if="!accessToken" class="mt-4 text-xs text-ink/50">Cần đăng nhập để lưu kết quả vào hồ sơ.</p>
    </section>

    <!-- Runner -->
    <div v-else-if="current" class="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_.85fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-7">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-ink/45">
          <span>CÂU {{ current.numberInTest ?? index + 1 }}<span v-if="groupPeers.length > 1"> · {{ positionInGroup }}/{{ groupPeers.length }} trong nhóm</span></span>
          <span class="flex flex-wrap gap-1.5">
            <span v-if="currentSection" class="rounded-lg bg-mint px-2 py-1 text-[11px] text-ink/55">{{ sectionLabel(currentSection.kind) }}</span>
            <span v-if="currentGroup" class="rounded-lg bg-mint px-2 py-1 text-[11px] text-ink/55">Part {{ currentGroup.part }} · {{ groupLabel(currentGroup.type) }}</span>
          </span>
        </div>

        <h2 v-if="!current.optionsHidden" class="mt-6 text-2xl font-extrabold leading-tight tracking-[-0.04em]">{{ textOf(current.prompt) }}</h2>
        <p v-else class="mt-6 text-sm leading-6 text-ink/60">{{ textOf(current.prompt) }}</p>

        <!-- Part 1 and 2 print no answer text; only the letters are shown. -->
        <div v-if="current.optionsHidden" class="mt-6 flex flex-wrap gap-2.5">
          <label
            v-for="option in current.options"
            :key="option.key"
            :class="['letter-choice focus-within:outline focus-within:outline-2 focus-within:outline-iris', answers[current.id] === option.key ? 'is-picked' : '']"
          >
            <input class="sr-only" type="radio" :name="`q-${current.id}`" :value="option.key" :checked="answers[current.id] === option.key" @change="saveAnswer(current.id, option.key)">
            {{ option.key }}
          </label>
        </div>

        <div v-else class="mt-6 space-y-3">
          <label
            v-for="option in current.options"
            :key="option.key"
            :class="['flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition', answers[current.id] === option.key ? 'border-iris bg-azure' : 'border-line hover:border-iris/40']"
          >
            <input class="sr-only" type="radio" :name="`q-${current.id}`" :value="option.key" :checked="answers[current.id] === option.key" @change="saveAnswer(current.id, option.key)">
            <span :class="['grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold', answers[current.id] === option.key ? 'bg-iris text-white' : 'bg-mint text-ink/60']">{{ option.key }}</span>
            <span class="text-sm font-bold">{{ textOf(option.text) }}</span>
          </label>
        </div>

        <p v-if="current.optionsHidden" class="mt-4 text-xs leading-5 text-ink/45">Bốn phương án chỉ được đọc trong audio, không in ra — đúng như đề thi thật.</p>

        <div class="mt-8 flex flex-wrap justify-between gap-3">
          <AppButton variant="secondary" :disabled="index === 0" @click="index -= 1">Câu trước</AppButton>
          <AppButton v-if="index < questions.length - 1" @click="index += 1">Câu tiếp</AppButton>
          <AppButton v-else variant="accent" :loading="submitting" @click="submit(false)">{{ submitting ? 'Đang nộp…' : 'Nộp bài' }}</AppButton>
        </div>
      </section>

      <!-- Stimulus the question hangs off -->
      <aside class="space-y-4">
        <section v-if="groupAudioUrl" class="rounded-[22px] bg-azure p-5">
          <p class="text-xs font-extrabold text-[#1288C8]">AUDIO CỦA NHÓM</p>
          <audio :key="currentGroup?.id" class="mt-3 w-full" controls preload="metadata" :src="groupAudioUrl" />
        </section>

        <section v-if="photoCaptionOf(currentGroup)" class="rounded-[22px] border border-line p-5">
          <p class="text-xs font-extrabold text-ink/45">TRANH</p>
          <div class="mt-3 grid place-items-center rounded-2xl bg-mint p-6 text-center">
            <AppIcon icon="solar:gallery-round-bold" :size="28" />
            <p class="mt-2 text-xs leading-5 text-ink/55">{{ photoCaptionOf(currentGroup) }}</p>
          </div>
          <p class="mt-3 text-[11px] leading-5 text-ink/45">Ảnh gốc chưa được gắn vào nhóm; admin upload và gắn ở màn Media là hiện đúng tranh.</p>
        </section>

        <section v-for="(passage, position) in passagesOf(currentGroup)" :key="position" class="rounded-[22px] border border-line p-5">
          <p class="text-xs font-extrabold text-ink/45">{{ passage.label || `VĂN BẢN ${position + 1}` }}</p>
          <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink/70">{{ passage.body }}</p>
        </section>

        <section v-if="directionsOf(currentGroup)" class="rounded-[22px] bg-mint p-5">
          <p class="text-xs font-extrabold text-[#46A900]">HƯỚNG DẪN</p>
          <p class="mt-2 text-sm leading-6 text-ink/65">{{ directionsOf(currentGroup) }}</p>
        </section>
      </aside>
    </div>

    <section v-else class="mx-auto max-w-2xl rounded-2xl bg-mint p-6 text-center">
      <p class="text-sm font-extrabold">Đề này chưa có câu hỏi nào</p>
      <p class="mt-1.5 text-xs leading-5 text-ink/55">Admin cần gắn câu hỏi vào đề trước khi learner làm được.</p>
    </section>
  </div>
</template>

<style scoped>
.letter-choice {
  display: grid;
  place-items: center;
  width: 3.4rem;
  height: 3.4rem;
  border: 1px solid var(--line);
  border-radius: 18px;
  corner-shape: squircle;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 800;
  color: rgba(38, 50, 56, .6);
  transition: background-color .15s ease, border-color .15s ease, color .15s ease;
}
.letter-choice:hover { background: var(--mint); }
.letter-choice.is-picked { border-color: var(--iris); background: var(--iris); color: #fff; }
</style>
