<script setup lang="ts">
import { countWords } from '~/utils/learning';
import type { CatalogItem } from '~/utils/catalog';
import { lessonMeta, numberOf, textOf, toLessonSummary } from '~/utils/catalog';

const route = useRoute();
const { request, accessToken } = useAppApi();
const toast = useToast();

const slug = computed(() => String(route.params.slug));
const lesson = ref<ReturnType<typeof toLessonSummary> | null>(null);
const instruction = ref('');
const keywords = ref<string[]>([]);
const wordLimit = ref<number | null>(null);
const loading = ref(true);
const notFound = ref(false);

const body = ref('');
const submitting = ref(false);
const creditsRemaining = ref<number | null>(null);

const words = computed(() => countWords(body.value));
const overLimit = computed(() => wordLimit.value !== null && words.value > wordLimit.value);

async function loadPrompt() {
  loading.value = true;
  try {
    const item = await request<CatalogItem>(`/content/${slug.value}`);
    lesson.value = toLessonSummary(item);
    instruction.value = textOf(item.payload?.instruction);
    wordLimit.value = numberOf(item.payload?.wordLimit);
    keywords.value = Array.isArray(item.payload?.keywords) ? (item.payload.keywords as unknown[]).filter((word): word is string => typeof word === 'string') : [];
  } catch { notFound.value = true; }
  finally { loading.value = false; }
}

async function submit() {
  if (!body.value.trim() || submitting.value) return;
  if (!accessToken.value) { toast.info('Đăng nhập để gửi bài', 'Bài viết và nhận xét được lưu vào hồ sơ của bạn.'); return; }
  submitting.value = true;
  try {
    const result = await request<{ submissionId?: string; status?: string; creditsRemaining?: number }>('/writing/submissions', { method: 'POST', body: { part: lesson.value?.part ?? 1, body: body.value } });
    creditsRemaining.value = result.creditsRemaining ?? null;
    body.value = '';
    toast.success('Đã gửi bài', result.creditsRemaining === undefined ? 'Reviewer sẽ trả nhận xét trong lịch sử Writing.' : `Còn ${result.creditsRemaining} lượt chấm. Nhận xét sẽ hiện trong lịch sử.`);
  } catch { toast.error('Chưa gửi được bài', 'Kiểm tra phiên đăng nhập hoặc số lượt chấm còn lại.'); }
  finally { submitting.value = false; }
}

onMounted(loadPrompt);
</script>

<template>
  <div class="page-enter space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
      <div class="min-w-0">
        <NuxtLink to="/write" class="inline-flex items-center gap-1.5 text-xs font-bold text-iris hover:underline focus-ring"><AppIcon icon="solar:arrow-left-linear" :size="15" /> Danh sách đề viết</NuxtLink>
        <h1 class="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">{{ lesson?.title ?? (loading ? 'Đang mở đề…' : 'Không tìm thấy đề') }}</h1>
        <div v-if="lesson && lessonMeta(lesson).length" class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="meta in lessonMeta(lesson)" :key="meta" class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ meta }}</span>
        </div>
      </div>
      <div class="rounded-2xl bg-mint px-4 py-3 text-right">
        <p class="text-[11px] font-bold text-ink/50">Số từ</p>
        <p :class="['mt-0.5 text-xl font-extrabold', overLimit ? 'text-[#B5473A]' : '']">{{ words }}<span v-if="wordLimit" class="text-sm text-ink/45"> / {{ wordLimit }}</span></p>
      </div>
    </div>

    <div v-if="notFound" class="rounded-[22px] border border-line p-8">
      <p class="text-sm font-extrabold">Đề này không còn được publish</p>
      <p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Có thể nó đã bị gỡ hoặc đổi slug. Quay lại danh sách để chọn đề khác.</p>
      <NuxtLink to="/write" class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Về danh sách</NuxtLink>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-7">
        <div class="rounded-2xl bg-mint p-4">
          <p class="text-xs font-extrabold text-[#46A900]">YÊU CẦU ĐỀ</p>
          <p class="mt-2 text-sm leading-6 text-ink/70">{{ instruction || lesson?.summary || 'Viết theo yêu cầu của đề.' }}</p>
          <div v-if="keywords.length" class="mt-3 flex flex-wrap gap-1.5">
            <span v-for="word in keywords" :key="word" class="rounded-lg bg-white px-2 py-1 text-[11px] font-extrabold text-ink/65">{{ word }}</span>
          </div>
        </div>

        <label class="mt-6 block text-xs font-extrabold" for="writing-body">Bài viết của bạn</label>
        <textarea id="writing-body" v-model="body" rows="12" class="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm leading-6 outline-none" placeholder="Bắt đầu viết ở đây…" />

        <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p class="text-xs text-ink/55">
            <span v-if="overLimit" class="font-bold text-[#B5473A]">Đang vượt {{ words - (wordLimit ?? 0) }} từ so với giới hạn.</span>
            <span v-else>Viết xong hãy đọc lại một lượt trước khi gửi.</span>
          </p>
          <AppButton :loading="submitting" :disabled="!body.trim()" @click="submit">{{ submitting ? 'Đang gửi…' : 'Gửi chấm bài' }}</AppButton>
        </div>
        <p v-if="creditsRemaining !== null" class="mt-3 text-xs font-bold text-ink/55">Còn {{ creditsRemaining }} lượt chấm.</p>
      </section>

      <aside class="space-y-4">
        <section class="rounded-[22px] bg-azure p-5">
          <p class="text-xs font-extrabold text-[#1288C8]">TRƯỚC KHI GỬI</p>
          <ul class="mt-3 space-y-2 text-xs leading-5 text-ink/65">
            <li>Đủ ý mà đề yêu cầu, không thêm thông tin thừa.</li>
            <li>Câu đầu nêu thẳng mục đích, câu cuối nêu bước tiếp theo.</li>
            <li>Đọc lại một lượt để bắt lỗi chia động từ và giới từ.</li>
          </ul>
        </section>
        <section class="rounded-[22px] border border-line p-5">
          <p class="text-xs font-extrabold text-ink/45">SAU KHI GỬI</p>
          <p class="mt-2 text-xs leading-5 text-ink/55">Bài vào hàng chờ với trạng thái GRADING. Khi reviewer chấm xong, điểm và nhận xét hiện trong lịch sử ở trang danh sách.</p>
          <NuxtLink to="/write" class="mt-3 inline-flex text-xs font-bold text-iris hover:underline focus-ring">Xem lịch sử feedback →</NuxtLink>
        </section>
      </aside>
    </div>
  </div>
</template>
