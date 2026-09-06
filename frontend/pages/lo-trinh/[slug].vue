<script setup lang="ts">
import { evaluateRoadmap, findTrack, roadmapTracks, type SurfaceProgress } from '~/utils/roadmap';

const route = useRoute();
const { request, accessToken } = useAppApi();
const { initial } = useSession();

const track = computed(() => findTrack(String(route.params.slug)));
const progress = ref<SurfaceProgress | null>(null);
const trail = ref<{ scrollToCurrent: () => void } | null>(null);

const roadmap = computed(() => track.value ? evaluateRoadmap(track.value, progress.value) : null);
const current = computed(() => roadmap.value && roadmap.value.currentIndex >= 0 ? roadmap.value.stages[roadmap.value.currentIndex] : null);
const others = computed(() => roadmapTracks.filter((item) => item.slug !== track.value?.slug));

useHead(() => ({ title: track.value ? `${track.value.title} — Ms Chole TOEIC` : 'Lộ trình — Ms Chole TOEIC' }));

onMounted(async () => {
  if (!accessToken.value) return;
  try { progress.value = await request<SurfaceProgress>('/learning/surface-progress'); }
  catch { progress.value = null; }
});
</script>

<template>
  <div v-if="!track" class="mx-auto max-w-[720px] px-4 py-16 text-center sm:px-6">
    <p class="text-xs font-extrabold text-[#B5473A]">KHÔNG TÌM THẤY</p>
    <h1 class="mt-2 text-2xl font-extrabold tracking-[-0.04em]">Chưa có lộ trình cho kỳ thi này</h1>
    <p class="mt-2 text-sm leading-6 text-ink/55">Hiện có bốn lộ trình: TOEIC, IELTS, TOEFL và VSTEP.</p>
    <NuxtLink to="/lo-trinh" class="cta-sky mt-6 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Xem tất cả lộ trình</NuxtLink>
  </div>

  <div v-else class="roadmap-page" :style="{ '--accent': track.accent, '--accent-soft': track.accentSoft }">
    <div class="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
      <NuxtLink to="/lo-trinh" class="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-bold text-ink/45 hover:text-iris focus-ring">
        <AppIcon icon="solar:alt-arrow-left-linear" :size="15" aria-hidden="true" /> Tất cả lộ trình
      </NuxtLink>

      <header class="mt-4 flex flex-wrap items-start justify-between gap-5">
        <div class="min-w-0 max-w-2xl">
          <p class="flex items-center gap-2 text-xs font-extrabold tracking-[.08em]" :style="{ color: track.accent }">
            <AppIcon :icon="track.icon" :size="16" aria-hidden="true" /> {{ track.exam }}
          </p>
          <h1 class="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">{{ track.title }}</h1>
          <p class="mt-3 text-sm leading-6 text-ink/60">{{ track.tagline }}</p>
        </div>

        <div class="rounded-[20px] border border-line px-5 py-4 text-center">
          <p class="text-[11px] font-bold text-ink/45">Tiến độ</p>
          <p class="mt-0.5 text-2xl font-black tabular-nums" :style="{ color: track.accent }">{{ roadmap!.doneCount }}<span class="text-base text-ink/35">/{{ roadmap!.total }}</span></p>
          <p class="mt-0.5 text-[11px] text-ink/45">chặng đã chinh phục</p>
        </div>
      </header>

      <dl class="mt-6 flex flex-wrap gap-x-8 gap-y-3 rounded-[20px] border border-line px-5 py-4 text-xs">
        <div class="flex gap-2"><dt class="font-bold text-ink/45">Dành cho:</dt><dd class="font-extrabold">{{ track.audience }}</dd></div>
        <div class="flex gap-2"><dt class="font-bold text-ink/45">Thời lượng:</dt><dd class="font-extrabold">{{ track.duration }}</dd></div>
        <div class="flex gap-2"><dt class="font-bold text-ink/45">Mục tiêu:</dt><dd class="font-extrabold">{{ track.bands }}</dd></div>
        <div class="flex gap-2"><dt class="font-bold text-ink/45">Số chặng:</dt><dd class="font-extrabold tabular-nums">{{ roadmap!.total }}</dd></div>
      </dl>

      <p v-if="track.status === 'planned'" class="mt-4 flex items-start gap-3 rounded-[22px] border border-sun bg-sun/40 p-4 text-xs font-bold leading-5 text-[#8A6100]">
        <AppIcon icon="solar:hourglass-bold" :size="18" class="mt-px shrink-0" aria-hidden="true" />
        <span>Lộ trình {{ track.exam }} đã lên kế hoạch nhưng chưa có bài học. Các chặng dưới đây cho bạn thấy tuyến đường; nội dung sẽ mở dần.</span>
      </p>
      <p v-else-if="!accessToken" class="mt-4 flex items-start gap-3 rounded-[22px] border border-line bg-azure p-4 text-xs font-bold leading-5 text-[#1288C8]">
        <AppIcon icon="solar:info-circle-bold" :size="18" class="mt-px shrink-0" aria-hidden="true" />
        <span>Bạn chưa đăng nhập nên lộ trình đang hiển thị từ chặng đầu. Đăng nhập để thấy đúng vị trí của mình.</span>
      </p>

      <section class="trail-panel mt-6">
        <div class="flex flex-wrap items-start justify-between gap-3 border-b border-line/70 px-5 pb-4 pt-5 sm:px-7">
          <div class="min-w-0">
            <p class="text-[11px] font-extrabold tracking-[.08em] text-ink/40">BẢN ĐỒ CHINH PHỤC</p>
            <p class="mt-1 text-lg font-extrabold tracking-[-0.03em]">
              {{ current ? `Đang chinh phục: ${current.title}` : track.status === 'live' ? 'Bạn đã đi hết lộ trình này' : 'Tuyến đường dự kiến' }}
            </p>
            <p class="mt-0.5 text-xs text-ink/45">
              {{ track.status === 'live'
                ? `${roadmap!.doneCount}/${roadmap!.total} chặng đã chinh phục · còn ${roadmap!.total - roadmap!.doneCount} chặng`
                : `${roadmap!.total} chặng, chưa chặng nào mở` }}
            </p>
          </div>
          <button v-if="current" class="locate-button focus-ring" @click="trail?.scrollToCurrent()">
            <AppIcon icon="solar:map-point-wave-bold" :size="15" aria-hidden="true" /> Vị trí của tôi
          </button>
        </div>

        <div class="trail-canvas px-4 py-8 sm:px-8">
          <RoadmapTrail
            ref="trail"
            :roadmap="roadmap!"
            :accent="track.accent"
            :interactive="track.status === 'live'"
            :learner-initial="initial"
          />
        </div>
      </section>

      <section v-if="current" class="mt-6 rounded-[22px] border border-line p-5 sm:p-7">
        <p class="text-xs font-extrabold text-ink/45">CHẶNG TIẾP THEO</p>
        <h2 class="mt-1 text-xl font-extrabold tracking-[-0.03em]">{{ current.title }}</h2>
        <p class="mt-2 max-w-xl text-xs leading-5 text-ink/55">{{ current.detail }}</p>
        <p class="mt-3 text-xs font-bold tabular-nums" :style="{ color: track.accent }">
          {{ current.achieved }}/{{ current.requirement.target }} {{ current.requirement.unit }}
        </p>
        <NuxtLink v-if="track.status === 'live'" :to="current.to" class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Vào học chặng này</NuxtLink>
        <p v-else class="mt-5 text-xs font-bold text-ink/40">Chặng này chưa mở.</p>
      </section>

      <section class="mt-8">
        <p class="text-xs font-extrabold text-ink/45">LỘ TRÌNH KHÁC</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <NuxtLink
            v-for="other in others"
            :key="other.slug"
            :to="`/lo-trinh/${other.slug}`"
            class="other-track focus-ring"
            :style="{ '--accent': other.accent, '--accent-soft': other.accentSoft }"
          >
            <AppIcon :icon="other.icon" :size="15" aria-hidden="true" /> {{ other.exam }}
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.trail-panel {
  border-radius: 24px;
  border: 1px solid var(--line, #DCECDF);
  overflow: hidden;
  background: #FFFFFF;
}

/* A soft outdoor wash so the road reads as a map rather than a diagram on a form. */
.trail-canvas {
  background:
    radial-gradient(120% 60% at 12% 4%, color-mix(in srgb, var(--accent) 9%, transparent) 0%, transparent 60%),
    radial-gradient(90% 50% at 92% 96%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 55%),
    linear-gradient(#FBFAF6, #F6F8F4);
}

.locate-button {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: .35rem;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  background: #FFFFFF;
  padding: .5rem .75rem;
  font-size: .6875rem;
  font-weight: 800;
  color: var(--accent);
  transition: background-color .16s ease;
}

.locate-button:hover { background: var(--accent-soft); }

.other-track {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  border-radius: 12px;
  background: var(--accent-soft);
  padding: .5rem .8rem;
  font-size: .6875rem;
  font-weight: 800;
  color: var(--accent);
  transition: translate .16s ease;
}

.other-track:hover { translate: 0 -2px; }

@media (prefers-reduced-motion: reduce) {
  .locate-button, .other-track { transition: none; }
}
</style>
