<script setup lang="ts">
import type { CatalogItem, LessonSummary } from '~/utils/catalog';
import { toLessonSummary } from '~/utils/catalog';

const { request } = useAppApi();
const videos = ref<LessonSummary[]>([]);
const loading = ref(true);
const failed = ref(false);
const category = ref('all');

const categories = computed(() => ['all', ...Array.from(new Set(videos.value.map((video) => video.category).filter(Boolean))).sort()]);
const visible = computed(() => category.value === 'all' ? videos.value : videos.value.filter((video) => video.category === category.value));
const playable = computed(() => videos.value.filter((video) => video.mediaAssetId).length);

async function loadCatalog() {
  loading.value = true;
  try { videos.value = (await request<CatalogItem[]>('/content', { query: { type: 'VIDEO' } })).map(toLessonSummary); }
  catch { failed.value = true; }
  finally { loading.value = false; }
}

onMounted(loadCatalog);
</script>

<template>
  <div class="page-enter space-y-6">
    <section class="rounded-[26px] bg-mint p-6 sm:p-9">
      <p class="text-xs font-extrabold tracking-[0.18em] text-[#46A900]">VIDEO LAB</p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Học qua những đoạn ngắn.</h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-ink/60">Chọn một video trong thư viện, xem một ý chính rồi quay lại bài tập để biến nó thành phản xạ.</p>
        </div>
        <span class="rounded-xl bg-white/70 px-3 py-2 text-xs font-extrabold text-ink/60">{{ videos.length }} video · {{ playable }} phát được</span>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div><p class="text-xs font-extrabold text-ink/45">THƯ VIỆN VIDEO</p><h2 class="mt-1 text-xl font-extrabold">{{ visible.length }} video</h2></div>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadCatalog">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>

        <div v-if="categories.length > 1" class="mt-5 flex flex-wrap gap-2" role="group" aria-label="Lọc theo chủ đề">
          <button v-for="item in categories" :key="item" :class="['filter-chip focus-ring', category === item ? 'is-active' : '']" @click="category = item">{{ item === 'all' ? 'Tất cả' : item }}</button>
        </div>

        <div class="mt-5">
          <LessonList
            :lessons="visible"
            :loading="loading"
            tone="bean"
            icon="solar:play-circle-bold"
            action-label="Xem"
            :href="(lesson) => `/video/${lesson.slug}`"
            :empty-title="failed ? 'Chưa tải được thư viện video' : 'Chưa có video nào được publish'"
            :empty-detail="failed ? 'Kiểm tra kết nối tới API rồi tải lại danh sách.' : 'Admin publish video trong console là danh sách này có nội dung.'"
          />
        </div>
      </section>

      <aside class="space-y-4">
        <section class="rounded-[22px] bg-azure p-5 sm:p-6">
          <p class="text-xs font-extrabold text-[#1288C8]">XEM SAO CHO HIỆU QUẢ</p>
          <p class="mt-2 text-xs leading-5 text-ink/65">Xem một video ngắn rồi làm ngay vài câu ở khu vực tương ứng. Kiến thức chỉ đọng lại khi bạn dùng nó trong vòng vài phút.</p>
        </section>
        <section class="rounded-[22px] border border-line p-5 sm:p-6">
          <p class="text-xs font-extrabold text-ink/45">TÌNH TRẠNG KHO</p>
          <p class="mt-3 text-sm leading-6 text-ink/60"><span class="font-extrabold text-ink">{{ playable }}</span> / {{ videos.length }} video đã gắn file.</p>
          <p class="mt-2 text-xs leading-5 text-ink/45">Video chưa gắn file vẫn mở được để đọc mô tả; admin gắn asset ở màn Media là xem được.</p>
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
