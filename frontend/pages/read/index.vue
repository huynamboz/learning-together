<script setup lang="ts">
import type { CatalogItem, LessonSummary } from '~/utils/catalog';
import { toLessonSummary } from '~/utils/catalog';

const { request } = useAppApi();
const grammar = ref<LessonSummary[]>([]);
const reading = ref<LessonSummary[]>([]);
const loading = ref(true);
const failed = ref(false);
const tab = ref<'grammar' | 'reading'>('grammar');

const tabs = [
  { key: 'grammar' as const, label: 'Ngữ pháp', detail: 'Part 5 · từng điểm ngữ pháp' },
  { key: 'reading' as const, label: 'Bài đọc', detail: 'Part 6–7 · đoạn văn và câu hỏi' }
];

const visible = computed(() => tab.value === 'grammar' ? grammar.value : reading.value);

async function loadCatalog() {
  loading.value = true;
  try {
    const [grammarItems, readingItems] = await Promise.all([
      request<CatalogItem[]>('/content', { query: { type: 'GRAMMAR' } }),
      request<CatalogItem[]>('/content', { query: { type: 'READING' } })
    ]);
    grammar.value = grammarItems.map(toLessonSummary);
    reading.value = readingItems.map(toLessonSummary);
  } catch { failed.value = true; }
  finally { loading.value = false; }
}

onMounted(loadCatalog);
</script>

<template>
  <div class="page-enter space-y-6">
    <section class="rounded-[26px] bg-azure p-6 sm:p-9">
      <p class="text-xs font-extrabold tracking-[0.18em] text-iris">READING LAB</p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Đọc nhanh, hiểu sâu.</h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-ink/60">Chọn một điểm ngữ pháp hoặc một bài đọc, làm hết câu hỏi của bài rồi xem giải thích.</p>
        </div>
        <span class="rounded-xl bg-white/70 px-3 py-2 text-xs font-extrabold text-ink/60">{{ grammar.length + reading.length }} bài đã publish</span>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex flex-wrap gap-2" role="tablist" aria-label="Nhóm nội dung đọc">
          <button v-for="item in tabs" :key="item.key" :class="['group-tab focus-ring', tab === item.key ? 'is-active' : '']" role="tab" :aria-selected="tab === item.key" @click="tab = item.key">
            <span class="block text-xs font-extrabold">{{ item.label }}</span>
            <span class="mt-0.5 block text-[11px] opacity-70">{{ item.detail }}</span>
          </button>
        </div>

        <div class="mt-6 flex items-end justify-between gap-3">
          <h2 class="text-xl font-extrabold">{{ visible.length }} bài</h2>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadCatalog">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>

        <div class="mt-4">
          <LessonList
            :lessons="visible"
            :loading="loading"
            tone="iris"
            icon="solar:book-2-bold"
            :href="(lesson) => `/read/${lesson.slug}`"
            :empty-title="failed ? 'Chưa tải được kho đọc' : 'Nhóm này chưa có bài nào'"
            :empty-detail="failed ? 'Kiểm tra kết nối tới API rồi tải lại danh sách.' : 'Admin publish bài trong console là danh sách này có nội dung.'"
          />
        </div>
      </section>

      <aside class="space-y-4">
        <section class="rounded-[22px] bg-mint p-5 sm:p-6">
          <p class="text-xs font-extrabold text-[#46A900]">CÁCH DÙNG</p>
          <h2 class="mt-2 text-lg font-extrabold">Một bài, một điểm ngữ pháp</h2>
          <p class="mt-2 text-xs leading-5 text-ink/60">Mỗi bài gom các câu hỏi cùng một điểm kiến thức. Làm hết bài rồi mới sang bài khác sẽ nhớ lâu hơn là làm rải rác.</p>
        </section>
        <section class="rounded-[22px] border border-line p-5 sm:p-6">
          <p class="text-xs font-extrabold text-ink/45">CHẤM ĐIỂM</p>
          <p class="mt-3 text-xs leading-5 text-ink/55">Đáp án được chấm ở server, không nằm trong dữ liệu gửi về trình duyệt. Khi bạn đăng nhập, mỗi câu trả lời đều được lưu vào tiến độ.</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.group-tab {
  flex: 1 1 12rem;
  border-radius: 16px;
  corner-shape: squircle;
  border: 1px solid var(--line);
  padding: .75rem 1rem;
  text-align: left;
  color: rgba(38, 50, 56, .65);
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.group-tab:hover { background: var(--mint); }
.group-tab.is-active { border-color: var(--iris); background: var(--iris); color: #fff; }
</style>
