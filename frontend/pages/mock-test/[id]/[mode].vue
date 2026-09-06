<script setup lang="ts">
type JsonText = { text?: string };
type CatalogTest = { id: string; slug: string; title: string; durationMin: number; questionCount: number };
type ExamQuestion = { id: string; prompt: JsonText; options: Array<{ key: string; text: JsonText }> };
type ExamSession = { sessionId: string; mode: string; durationMin: number; questions: ExamQuestion[] };
type ExamResult = { total: number; correct: number; wrong: number; unanswered: number; score: number };

const route = useRoute();
const { request, accessToken } = useAppApi();
const toast = useToast();
const { confirm } = useConfirm();

const testId = computed(() => String(route.params.id));
const mode = computed<'practice' | 'exam'>(() => route.params.mode === 'exam' ? 'exam' : 'practice');

const test = ref<CatalogTest | null>(null);
const session = ref<ExamSession | null>(null);
const result = ref<ExamResult | null>(null);
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
    session.value = await request<ExamSession>('/exam-sessions', { method: 'POST', body: { testId: testId.value, mode: mode.value } });
    seconds.value = (session.value.durationMin ?? test.value?.durationMin ?? 10) * 60;
    index.value = 0;
    answers.value = {};
    result.value = null;
    if (mode.value === 'exam') {
      timer = setInterval(() => { if (seconds.value > 0) seconds.value -= 1; else void submit(true); }, 1000);
    }
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
    result.value = await request<ExamResult>(`/exam-sessions/${session.value.sessionId}/submit`, { method: 'POST' });
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
          <span v-if="test" class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ test.durationMin }} phút</span>
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

    <section v-else-if="result" class="mx-auto max-w-2xl rounded-[22px] border border-line p-6 text-center sm:p-10">
      <p class="text-xs font-extrabold tracking-[0.18em] text-iris">KẾT QUẢ</p>
      <p class="mt-5 text-6xl font-extrabold tracking-[-0.08em]">{{ result.correct }}<span class="text-2xl text-ink/30"> / {{ result.total }}</span></p>
      <p class="mt-3 text-sm text-ink/55">TOEIC quy đổi {{ result.score }} · sai {{ result.wrong }} · bỏ trống {{ result.unanswered }}.</p>
      <div class="mt-7 flex flex-wrap justify-center gap-2">
        <NuxtLink to="/mock-test" class="cta-sky inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Chọn đề khác</NuxtLink>
        <button class="cta-grass px-4 py-3 text-xs font-extrabold focus-ring" @click="start">Làm lại đề này</button>
      </div>
    </section>

    <section v-else-if="!session" class="mx-auto max-w-2xl rounded-[22px] border border-line p-6 text-center sm:p-10">
      <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-azure text-iris"><AppIcon icon="solar:clipboard-list-bold" :size="30" /></span>
      <h2 class="mt-5 text-2xl font-extrabold tracking-[-0.04em]">Sẵn sàng cho {{ modeLabel.toLowerCase() }}?</h2>
      <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/55">
        {{ mode === 'exam' ? 'Đồng hồ chạy ngay khi bắt đầu và bài tự nộp khi hết giờ.' : 'Không có đồng hồ đếm ngược — tập trung vào việc hiểu vì sao một đáp án đúng.' }}
      </p>
      <AppButton class="mt-7" :loading="starting" @click="start">{{ starting ? 'Đang tạo phiên…' : 'Bắt đầu' }}</AppButton>
      <p v-if="!accessToken" class="mt-4 text-xs text-ink/50">Cần đăng nhập để lưu kết quả vào hồ sơ.</p>
    </section>

    <section v-else-if="current" class="mx-auto max-w-3xl rounded-[22px] border border-line p-5 sm:p-8">
      <div class="flex items-center justify-between text-xs font-extrabold text-ink/45">
        <span>CÂU {{ index + 1 }} / {{ questions.length }}</span>
        <span>{{ answered }} đã trả lời</span>
      </div>

      <h2 class="mt-7 text-2xl font-extrabold leading-tight tracking-[-0.04em]">{{ textOf(current.prompt) }}</h2>

      <div class="mt-7 space-y-3">
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

      <div class="mt-8 flex flex-wrap justify-between gap-3">
        <AppButton variant="secondary" :disabled="index === 0" @click="index -= 1">Câu trước</AppButton>
        <AppButton v-if="index < questions.length - 1" @click="index += 1">Câu tiếp</AppButton>
        <AppButton v-else variant="accent" :loading="submitting" @click="submit(false)">{{ submitting ? 'Đang nộp…' : 'Nộp bài' }}</AppButton>
      </div>
    </section>

    <section v-else class="mx-auto max-w-2xl rounded-2xl bg-mint p-6 text-center">
      <p class="text-sm font-extrabold">Đề này chưa có câu hỏi nào</p>
      <p class="mt-1.5 text-xs leading-5 text-ink/55">Admin cần gắn câu hỏi vào đề trước khi learner làm được.</p>
    </section>
  </div>
</template>
