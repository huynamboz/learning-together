<script setup lang="ts">
import type { CatalogItem } from '~/utils/catalog';
import { availableParts, filterByPart, toLessonSummary } from '~/utils/catalog';

const { request } = useAppApi();
const lessons = ref<ReturnType<typeof toLessonSummary>[]>([]);
const loading = ref(true);
const failed = ref(false);
const activePart = ref<number | 'all'>('all');

const parts = computed(() => availableParts(lessons.value));
const visible = computed(() => filterByPart(lessons.value, activePart.value));
const withAudio = computed(() => lessons.value.filter((lesson) => lesson.mediaAssetId).length);

async function loadCatalog() {
  loading.value = true;
  try { lessons.value = (await request<CatalogItem[]>('/content', { query: { type: 'LISTENING' } })).map(toLessonSummary); }
  catch { failed.value = true; }
  finally { loading.value = false; }
}

onMounted(loadCatalog);
</script>

<template>
  <div class="page-enter space-y-6">
    <section class="rounded-[26px] bg-ink p-6 text-white sm:p-9">
      <div class="flex flex-wrap items-start justify-between gap-5">
        <div class="min-w-0">
          <p class="text-xs font-extrabold tracking-[0.18em] text-bean">LISTENING LAB</p>
          <h1 class="mt-3 text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Nghe để bắt nhịp.</h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-white/65">Chọn một bài trong kho đã publish, nghe kỹ một đoạn ngắn rồi đối chiếu transcript.</p>
        </div>
        <div class="rounded-2xl bg-white/10 px-4 py-3 text-right">
          <p class="text-[11px] text-white/55">Bài trong kho</p>
          <p class="mt-1 text-xl font-extrabold">{{ lessons.length }}</p>
        </div>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div><p class="text-xs font-extrabold text-ink/45">DANH SÁCH BÀI NGHE</p><h2 class="mt-1 text-xl font-extrabold">{{ visible.length }} bài</h2></div>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadCatalog">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>

        <div v-if="parts.length" class="mt-5 flex flex-wrap gap-2" role="group" aria-label="Lọc theo part">
          <button :class="['filter-chip focus-ring', activePart === 'all' ? 'is-active' : '']" @click="activePart = 'all'">Tất cả</button>
          <button v-for="part in parts" :key="part" :class="['filter-chip focus-ring', activePart === part ? 'is-active' : '']" @click="activePart = part">Part {{ part }}</button>
        </div>

        <div class="mt-5">
          <LessonList
            :lessons="visible"
            :loading="loading"
            tone="leaf"
            icon="solar:headphones-round-sound-bold"
            :href="(lesson) => `/listen/${lesson.slug}`"
            :empty-title="failed ? 'Chưa tải được kho nghe' : 'Chưa có bài nghe nào được publish'"
            :empty-detail="failed ? 'Kiểm tra kết nối tới API rồi tải lại danh sách.' : 'Admin publish bài nghe trong console là danh sách này có nội dung.'"
          />
        </div>
      </section>

      <aside class="space-y-4">
        <section class="rounded-[22px] bg-mint p-5 sm:p-6">
          <p class="text-xs font-extrabold text-[#46A900]">MẸO CỦA ĐẬU</p>
          <h2 class="mt-2 text-lg font-extrabold">Nghe trước, đọc sau</h2>
          <p class="mt-2 text-xs leading-5 text-ink/60">Nghe lần đầu không nhìn chữ. Ghi lại từ khoá và dự đoán ngữ cảnh, rồi mới mở transcript để đối chiếu.</p>
        </section>
        <section class="rounded-[22px] border border-line p-5 sm:p-6">
          <p class="text-xs font-extrabold text-ink/45">TÌNH TRẠNG KHO</p>
          <p class="mt-3 text-sm leading-6 text-ink/60"><span class="font-extrabold text-ink">{{ withAudio }}</span> / {{ lessons.length }} bài đã gắn file audio.</p>
          <p class="mt-2 text-xs leading-5 text-ink/45">Bài chưa có audio vẫn mở được để đọc transcript; admin gắn asset ở màn Media là phát được ngay.</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.filter-chip {
  border-radius: 12px;
  border: 1px solid var(--line);
  padding: .55rem .9rem;
  font-size: .72rem;
  font-weight: 800;
  color: rgba(38, 50, 56, .6);
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.filter-chip:hover { background: var(--mint); }
.filter-chip.is-active { border-color: var(--iris); background: var(--iris); color: #fff; }
</style>
