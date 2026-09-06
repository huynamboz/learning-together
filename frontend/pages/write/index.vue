<script setup lang="ts">
import type { CatalogItem, LessonSummary } from '~/utils/catalog';
import { toLessonSummary } from '~/utils/catalog';

type WritingHistory = { id: string; part: number; wordCount: number; status: string; submittedAt: string | null; createdAt: string; grade: { overall: number | null; feedback: unknown; createdAt: string } | null };

const { request, accessToken } = useAppApi();
const toast = useToast();

const prompts = ref<LessonSummary[]>([]);
const history = ref<WritingHistory[]>([]);
const loading = ref(true);
const historyLoading = ref(false);
const failed = ref(false);
const part = ref<1 | 2>(1);

const visible = computed(() => prompts.value.filter((prompt) => (prompt.part ?? 1) === part.value));
const graded = computed(() => history.value.filter((item) => item.status === 'GRADED').length);
const dateLabel = (value: string | null) => value ? new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'Bản nháp';

async function loadCatalog() {
  loading.value = true;
  try { prompts.value = (await request<CatalogItem[]>('/content', { query: { type: 'WRITING' } })).map(toLessonSummary); }
  catch { failed.value = true; }
  finally { loading.value = false; }
}

async function loadHistory() {
  if (!accessToken.value) { history.value = []; return; }
  historyLoading.value = true;
  try { history.value = await request<WritingHistory[]>('/writing/submissions'); }
  catch { toast.error('Chưa tải được lịch sử bài viết', 'Kiểm tra phiên đăng nhập rồi thử lại.'); }
  finally { historyLoading.value = false; }
}

onMounted(async () => { await Promise.all([loadCatalog(), loadHistory()]); });
</script>

<template>
  <div class="page-enter space-y-6">
    <section class="rounded-[26px] bg-mint p-6 sm:p-9">
      <p class="text-xs font-extrabold tracking-[0.18em] text-[#46A900]">WRITING LAB</p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Viết rõ ý hơn.</h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-ink/60">Chọn một đề trong danh sách, viết theo yêu cầu rồi gửi để nhận nhận xét theo tiêu chí TOEIC.</p>
        </div>
        <span class="rounded-xl bg-white/70 px-3 py-2 text-xs font-extrabold text-ink/60">{{ prompts.length }} đề · {{ graded }} bài đã chấm</span>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex flex-wrap gap-2" role="group" aria-label="Chọn part">
          <button :class="['part-tab focus-ring', part === 1 ? 'is-active' : '']" @click="part = 1">Part 1 · Picture</button>
          <button :class="['part-tab focus-ring', part === 2 ? 'is-active' : '']" @click="part = 2">Part 2 · Email</button>
        </div>

        <div class="mt-6 flex items-end justify-between gap-3">
          <h2 class="text-xl font-extrabold">{{ visible.length }} đề</h2>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadCatalog">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>

        <div class="mt-4">
          <LessonList
            :lessons="visible"
            :loading="loading"
            tone="grass"
            icon="solar:pen-new-square-bold"
            action-label="Viết bài"
            :href="(lesson) => `/write/${lesson.slug}`"
            :empty-title="failed ? 'Chưa tải được kho đề viết' : 'Part này chưa có đề nào'"
            :empty-detail="failed ? 'Kiểm tra kết nối tới API rồi tải lại danh sách.' : 'Admin publish đề Writing trong console là danh sách này có nội dung.'"
          />
        </div>
      </section>

      <aside class="space-y-4">
        <section class="rounded-[22px] border border-line p-5 sm:p-6">
          <div class="flex items-end justify-between gap-3">
            <div><p class="text-xs font-extrabold text-ink/45">BÀI GẦN ĐÂY</p><h2 class="mt-1 text-lg font-extrabold">Lịch sử feedback</h2></div>
            <button v-if="accessToken" class="rounded-xl border border-line px-2.5 py-1.5 text-[11px] font-extrabold hover:bg-mint focus-ring" :disabled="historyLoading" @click="loadHistory">{{ historyLoading ? '…' : 'Tải lại' }}</button>
          </div>

          <ol v-if="history.length" class="mt-4 space-y-2.5">
            <li v-for="item in history" :key="item.id" class="rounded-2xl bg-mint p-4">
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-extrabold">Part {{ item.part }} · {{ item.wordCount }} từ</p>
                <span :class="['rounded-lg px-2 py-0.5 text-[10px] font-extrabold', item.status === 'GRADED' ? 'bg-white text-[#46A900]' : 'bg-white text-iris']">{{ item.status }}</span>
              </div>
              <p class="mt-1.5 text-[11px] text-ink/45">{{ dateLabel(item.submittedAt ?? item.createdAt) }}<span v-if="item.grade?.overall !== null && item.grade"> · {{ item.grade.overall }}/10</span></p>
            </li>
          </ol>
          <p v-else-if="!accessToken" class="mt-4 rounded-2xl bg-mint p-4 text-xs leading-5 text-ink/55">Đăng nhập để lưu bài và xem nhận xét của reviewer.</p>
          <p v-else class="mt-4 rounded-2xl bg-mint p-4 text-xs leading-5 text-ink/55">Chưa có bài nào được gửi. Chọn một đề để bắt đầu.</p>
        </section>

        <section class="rounded-[22px] bg-sun p-5">
          <p class="text-xs font-extrabold text-[#A87400]">CÁCH CHẤM</p>
          <p class="mt-2 text-xs leading-5 text-ink/65">Bài được reviewer chấm thủ công theo rubric rồi trả về lịch sử của bạn. Không có điểm do máy tạo sẵn.</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.part-tab {
  flex: 1 1 10rem;
  border-radius: 14px;
  corner-shape: squircle;
  border: 1px solid var(--line);
  padding: .7rem 1rem;
  font-size: .75rem;
  font-weight: 800;
  color: rgba(38, 50, 56, .62);
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.part-tab:hover { background: var(--mint); }
.part-tab.is-active { border-color: var(--grass); background: var(--grass); color: #fff; }
</style>
