<script setup lang="ts">
import type { CatalogItem, LessonSummary } from '~/utils/catalog';
import { lessonMeta, toLessonSummary } from '~/utils/catalog';

const route = useRoute();
const config = useRuntimeConfig();
const { request } = useAppApi();

const slug = computed(() => String(route.params.slug));
const video = ref<LessonSummary | null>(null);
const others = ref<LessonSummary[]>([]);
const loading = ref(true);
const notFound = ref(false);

const mediaUrl = computed(() => video.value?.mediaAssetId ? `${config.public.apiBase}/media/${video.value.mediaAssetId}/file` : '');

async function load() {
  loading.value = true;
  try {
    const item = await request<CatalogItem>(`/content/${slug.value}`);
    video.value = toLessonSummary(item);
    const catalog = await request<CatalogItem[]>('/content', { query: { type: 'VIDEO' } });
    others.value = catalog.map(toLessonSummary).filter((entry) => entry.slug !== slug.value).slice(0, 5);
  } catch { notFound.value = true; }
  finally { loading.value = false; }
}

watch(slug, load);
onMounted(load);
</script>

<template>
  <div class="page-enter space-y-6">
    <div class="border-b border-line pb-5">
      <NuxtLink to="/video" class="inline-flex items-center gap-1.5 text-xs font-bold text-iris hover:underline focus-ring"><AppIcon icon="solar:arrow-left-linear" :size="15" /> Thư viện video</NuxtLink>
      <h1 class="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">{{ video?.title ?? (loading ? 'Đang mở video…' : 'Không tìm thấy video') }}</h1>
      <div v-if="video && lessonMeta(video).length" class="mt-3 flex flex-wrap gap-1.5">
        <span v-for="meta in lessonMeta(video)" :key="meta" class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ meta }}</span>
      </div>
    </div>

    <div v-if="notFound" class="rounded-[22px] border border-line p-8">
      <p class="text-sm font-extrabold">Video này không còn được publish</p>
      <p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Có thể nó đã bị gỡ hoặc đổi slug. Quay lại thư viện để chọn video khác.</p>
      <NuxtLink to="/video" class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Về thư viện</NuxtLink>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[1.35fr_.65fr] lg:items-start">
      <section class="min-w-0">
        <div class="overflow-hidden rounded-[22px] bg-ink">
          <video v-if="mediaUrl" :key="video?.id" class="aspect-video w-full" controls preload="metadata" :src="mediaUrl" />
          <div v-else class="grid aspect-video place-items-center p-8 text-center text-white">
            <div>
              <span class="grid h-14 w-14 place-items-center justify-self-center rounded-2xl bg-white/10"><AppIcon icon="solar:play-circle-bold" :size="28" /></span>
              <p class="mt-4 text-sm font-extrabold">Video chưa sẵn sàng</p>
              <p class="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/60">Admin cần upload, cho phép phát công khai và gắn file video vào bài này trước khi xem được.</p>
            </div>
          </div>
        </div>

        <p v-if="video?.summary" class="mt-5 rounded-[22px] bg-mint p-5 text-sm leading-6 text-ink/70">{{ video.summary }}</p>
      </section>

      <aside class="rounded-[22px] border border-line p-5 sm:p-6">
        <p class="text-xs font-extrabold text-ink/45">XEM TIẾP</p>
        <h2 class="mt-1 text-lg font-extrabold">Video khác trong kho</h2>
        <div class="mt-4">
          <LessonList
            :lessons="others"
            :loading="loading"
            tone="bean"
            icon="solar:play-circle-bold"
            action-label="Xem"
            :href="(lesson) => `/video/${lesson.slug}`"
            empty-title="Kho chỉ có video này"
            empty-detail="Khi admin publish thêm video, chúng sẽ xuất hiện ở đây."
          />
        </div>
      </aside>
    </div>
  </div>
</template>
