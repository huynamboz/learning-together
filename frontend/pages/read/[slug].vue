<script setup lang="ts">
import type { CatalogItem } from '~/utils/catalog';
import { jsonText, lessonMeta, textOf, toLessonSummary } from '~/utils/catalog';

type PracticeQuestion = { id: string; prompt: Record<string, unknown>; options: Array<{ key: string; text: Record<string, unknown> }> };
type Verdict = { key: string; isCorrect: boolean; saved: boolean };

const route = useRoute();
const { request, accessToken } = useAppApi();
const toast = useToast();

const slug = computed(() => String(route.params.slug));
const lesson = ref<ReturnType<typeof toLessonSummary> | null>(null);
const passage = ref('');
const rule = ref('');
const questions = ref<PracticeQuestion[]>([]);
const loading = ref(true);
const notFound = ref(false);

const index = ref(0);
const selected = ref('');
const checking = ref(false);
const verdicts = ref<Record<string, Verdict>>({});

const current = computed(() => questions.value[index.value] ?? null);
const currentVerdict = computed(() => current.value ? verdicts.value[current.value.id] ?? null : null);
const answered = computed(() => Object.keys(verdicts.value).length);
const correct = computed(() => Object.values(verdicts.value).filter((verdict) => verdict.isCorrect).length);
const finished = computed(() => questions.value.length > 0 && answered.value === questions.value.length);

async function loadLesson() {
  loading.value = true;
  try {
    const item = await request<CatalogItem>(`/content/${slug.value}`);
    lesson.value = toLessonSummary(item);
    passage.value = textOf(item.payload?.passage);
    rule.value = textOf(item.payload?.rule);
    questions.value = await request<PracticeQuestion[]>('/practice/questions', { query: { lessonId: item.id, limit: 50 } });
  } catch { notFound.value = true; }
  finally { loading.value = false; }
}

async function checkAnswer() {
  if (!current.value || !selected.value || checking.value) return;
  const questionId = current.value.id;
  if (!accessToken.value) {
    toast.info('Đăng nhập để được chấm', 'Đáp án được chấm ở server nên cần phiên đăng nhập.');
    return;
  }
  checking.value = true;
  try {
    const result = await request<{ isCorrect: boolean }>('/learning/attempts', { method: 'POST', body: { questionId, context: 'PRACTICE', selectedAnswer: selected.value } });
    verdicts.value = { ...verdicts.value, [questionId]: { key: selected.value, isCorrect: result.isCorrect, saved: true } };
    if (result.isCorrect) toast.success('Chính xác', 'Câu trả lời đã được lưu vào tiến độ.');
    else toast.info('Chưa đúng', 'Xem lại điểm ngữ pháp rồi thử câu tiếp theo.');
  } catch { toast.error('Chưa chấm được câu này', 'Kiểm tra kết nối rồi thử lại.'); }
  finally { checking.value = false; }
}

function go(step: number) {
  const next = index.value + step;
  if (next < 0 || next >= questions.value.length) return;
  index.value = next;
  selected.value = verdicts.value[questions.value[next].id]?.key ?? '';
}

watch(current, (question) => { selected.value = question ? verdicts.value[question.id]?.key ?? '' : ''; });

onMounted(loadLesson);
</script>

<template>
  <div class="page-enter space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
      <div class="min-w-0">
        <NuxtLink to="/read" class="inline-flex items-center gap-1.5 text-xs font-bold text-iris hover:underline focus-ring"><AppIcon icon="solar:arrow-left-linear" :size="15" /> Danh sách bài đọc</NuxtLink>
        <h1 class="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">{{ lesson?.title ?? (loading ? 'Đang mở bài…' : 'Không tìm thấy bài') }}</h1>
        <div v-if="lesson && lessonMeta(lesson).length" class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="meta in lessonMeta(lesson)" :key="meta" class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ meta }}</span>
        </div>
      </div>
      <div v-if="questions.length" class="rounded-2xl bg-mint px-4 py-3 text-right">
        <p class="text-[11px] font-bold text-ink/50">Đã làm</p>
        <p class="mt-0.5 text-xl font-extrabold">{{ answered }} / {{ questions.length }}</p>
      </div>
    </div>

    <div v-if="notFound" class="rounded-[22px] border border-line p-8">
      <p class="text-sm font-extrabold">Bài này không còn được publish</p>
      <p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Có thể nó đã bị gỡ hoặc đổi slug. Quay lại danh sách để chọn bài khác.</p>
      <NuxtLink to="/read" class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Về danh sách</NuxtLink>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[1.25fr_.75fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-7">
        <template v-if="current">
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs font-extrabold text-ink/45">CÂU {{ String(index + 1).padStart(2, '0') }} / {{ String(questions.length).padStart(2, '0') }}</span>
            <span v-if="currentVerdict" :class="['rounded-lg px-2 py-1 text-[11px] font-extrabold', currentVerdict.isCorrect ? 'bg-mint text-[#46A900]' : 'bg-blush text-[#B5473A]']">{{ currentVerdict.isCorrect ? 'Đúng' : 'Chưa đúng' }}</span>
          </div>

          <h2 class="mt-6 text-2xl font-extrabold leading-tight tracking-[-0.04em]">{{ jsonText(current.prompt) }}</h2>

          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <label
              v-for="option in current.options"
              :key="option.key"
              :class="['flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition', selected === option.key ? 'border-iris bg-azure' : 'border-line hover:border-iris/40']"
            >
              <input v-model="selected" class="sr-only" type="radio" :name="`answer-${current.id}`" :value="option.key">
              <span :class="['grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold', selected === option.key ? 'bg-iris text-white' : 'bg-mint text-ink/60']">{{ option.key }}</span>
              <span class="text-sm font-bold">{{ jsonText(option.text) }}</span>
            </label>
          </div>

          <div class="mt-7 flex flex-wrap items-center justify-between gap-3">
            <div class="flex gap-2">
              <button class="nav-button focus-ring" :disabled="index === 0" @click="go(-1)"><AppIcon icon="solar:arrow-left-linear" :size="16" /> Câu trước</button>
              <button class="nav-button focus-ring" :disabled="index >= questions.length - 1" @click="go(1)">Câu sau <AppIcon icon="solar:arrow-right-linear" :size="16" /></button>
            </div>
            <AppButton :loading="checking" :disabled="!selected" @click="checkAnswer">{{ checking ? 'Đang chấm…' : currentVerdict ? 'Chấm lại' : 'Kiểm tra đáp án' }}</AppButton>
          </div>

          <div v-if="finished" class="mt-6 rounded-2xl bg-mint p-4">
            <p class="text-sm font-extrabold">Xong bài này — đúng {{ correct }} / {{ questions.length }} câu.</p>
            <NuxtLink to="/read" class="mt-3 inline-flex text-xs font-bold text-iris hover:underline focus-ring">Chọn bài tiếp theo →</NuxtLink>
          </div>
        </template>

        <div v-else-if="loading" class="rounded-2xl bg-mint p-6 text-sm text-ink/55">Đang tải câu hỏi của bài…</div>

        <div v-else class="rounded-2xl bg-mint p-6">
          <p class="text-sm font-extrabold">Bài này chưa có câu hỏi</p>
          <p class="mt-1.5 text-xs leading-5 text-ink/55">Nội dung đã publish nhưng chưa gắn câu hỏi nào. Bạn vẫn đọc được phần lý thuyết bên cạnh.</p>
        </div>
      </section>

      <aside class="space-y-4">
        <section v-if="passage" class="rounded-[22px] border border-line p-5 sm:p-6">
          <p class="text-xs font-extrabold text-ink/45">ĐOẠN VĂN</p>
          <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink/70">{{ passage }}</p>
        </section>
        <section v-if="rule" class="rounded-[22px] bg-mint p-5">
          <p class="text-xs font-extrabold text-[#46A900]">ĐIỂM NGỮ PHÁP</p>
          <p class="mt-2 text-sm leading-6 text-ink/65">{{ rule }}</p>
        </section>
        <section v-if="lesson?.summary" class="rounded-[22px] border border-line p-5">
          <p class="text-xs font-extrabold text-ink/45">BÀI NÀY VỀ GÌ</p>
          <p class="mt-2 text-sm leading-6 text-ink/60">{{ lesson.summary }}</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.nav-button {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  border-radius: 12px;
  border: 1px solid var(--line);
  padding: .55rem .85rem;
  font-size: .72rem;
  font-weight: 800;
  color: rgba(38, 50, 56, .65);
  transition: background-color .15s ease;
}
.nav-button:hover:not(:disabled) { background: var(--mint); }
.nav-button:disabled { opacity: .4; cursor: not-allowed; }
</style>
