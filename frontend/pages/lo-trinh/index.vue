<script setup lang="ts">
import { evaluateRoadmap, roadmapTracks, type SurfaceProgress } from '~/utils/roadmap';

const { request, accessToken } = useAppApi();
const progress = ref<SurfaceProgress | null>(null);

useHead({ title: 'Lộ trình — Ms Chole TOEIC' });

const cards = computed(() => roadmapTracks.map((track) => ({ track, roadmap: evaluateRoadmap(track, progress.value) })));
const liveTrack = computed(() => cards.value.find((card) => card.track.status === 'live') ?? null);

onMounted(async () => {
  if (!accessToken.value) return;
  try { progress.value = await request<SurfaceProgress>('/learning/surface-progress'); }
  catch { progress.value = null; }
});
</script>

<template>
  <div class="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8">
    <header class="max-w-2xl">
      <p class="text-xs font-extrabold tracking-[.08em] text-iris">LỘ TRÌNH</p>
      <h1 class="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Chọn kỳ thi, đi theo một tuyến đường</h1>
      <p class="mt-3 text-sm leading-6 text-ink/60">
        Mỗi lộ trình là một chuỗi chặng có thứ tự. Chặng chỉ được đánh dấu xong khi số liệu học thật của bạn đạt mốc, không phải khi bạn bấm vào.
      </p>
    </header>

    <p v-if="!accessToken" class="mt-6 flex items-start gap-3 rounded-[22px] border border-line bg-azure p-4 text-xs font-bold leading-5 text-[#1288C8]">
      <AppIcon icon="solar:info-circle-bold" :size="18" class="mt-px shrink-0" aria-hidden="true" />
      <span>Đăng nhập để lộ trình hiển thị đúng chặng bạn đang đứng. Chưa đăng nhập thì mọi lộ trình bắt đầu từ chặng một.</span>
    </p>

    <div class="mt-7 grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="card in cards"
        :key="card.track.slug"
        :to="`/lo-trinh/${card.track.slug}`"
        class="track-card group focus-ring"
        :style="{ '--accent': card.track.accent, '--accent-soft': card.track.accentSoft }"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="track-badge"><AppIcon :icon="card.track.icon" :size="22" aria-hidden="true" /></span>
          <span :class="['track-status', card.track.status === 'live' ? 'is-live' : '']">{{ card.track.status === 'live' ? 'Đang mở' : 'Sắp mở' }}</span>
        </div>

        <p class="mt-4 text-[11px] font-extrabold tracking-[.08em] text-ink/40">{{ card.track.exam }}</p>
        <h2 class="mt-1 text-lg font-extrabold tracking-[-0.03em]">{{ card.track.title }}</h2>
        <p class="mt-2 text-xs leading-5 text-ink/55">{{ card.track.tagline }}</p>

        <dl class="mt-4 space-y-1.5 text-[11px] text-ink/50">
          <div class="flex gap-2"><dt class="font-bold text-ink/40">Dành cho</dt><dd class="min-w-0 flex-1">{{ card.track.audience }}</dd></div>
          <div class="flex gap-2"><dt class="font-bold text-ink/40">Thời lượng</dt><dd class="min-w-0 flex-1">{{ card.track.duration }}</dd></div>
          <div class="flex gap-2"><dt class="font-bold text-ink/40">Mục tiêu</dt><dd class="min-w-0 flex-1">{{ card.track.bands }}</dd></div>
        </dl>

        <div class="mt-5 border-t border-line pt-4">
          <div class="flex items-center justify-between gap-3 text-[11px] font-extrabold">
            <span v-if="card.track.status === 'live'" class="text-ink/50">{{ card.roadmap.doneCount }}/{{ card.roadmap.total }} chặng đã xong</span>
            <span v-else class="text-ink/40">{{ card.roadmap.total }} chặng đã lên kế hoạch</span>
            <span class="track-cta">Xem lộ trình →</span>
          </div>
          <div v-if="card.track.status === 'live'" class="track-bar mt-2.5" role="presentation">
            <span :style="{ width: `${Math.max(2, card.roadmap.percent)}%` }"></span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <section v-if="liveTrack" class="mt-8 rounded-[22px] border border-line p-5 sm:p-7">
      <p class="text-xs font-extrabold text-ink/45">TIẾP TỤC</p>
      <h2 class="mt-1 text-xl font-extrabold tracking-[-0.03em]">
        {{ liveTrack.roadmap.currentIndex >= 0 ? liveTrack.roadmap.stages[liveTrack.roadmap.currentIndex].title : 'Bạn đã đi hết lộ trình TOEIC' }}
      </h2>
      <p class="mt-2 max-w-xl text-xs leading-5 text-ink/55">
        {{ liveTrack.roadmap.currentIndex >= 0 ? liveTrack.roadmap.stages[liveTrack.roadmap.currentIndex].detail : 'Quay lại bất kỳ chặng nào để giữ nhịp, hoặc làm thêm một đề thi thử.' }}
      </p>
      <NuxtLink
        :to="liveTrack.roadmap.currentIndex >= 0 ? liveTrack.roadmap.stages[liveTrack.roadmap.currentIndex].to : '/mock-test'"
        class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring"
      >Vào học chặng này</NuxtLink>
    </section>
  </div>
</template>

<style scoped>
.track-card {
  display: block;
  border-radius: 22px;
  border: 1px solid var(--line, #DCECDF);
  background: #FFFFFF;
  padding: 1.35rem;
  transition: transform .18s cubic-bezier(.22, 1, .36, 1), box-shadow .18s ease, border-color .18s ease;
}

.track-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
  box-shadow: 0 16px 34px rgba(38, 50, 56, .1);
}

.track-badge {
  display: grid;
  height: 46px;
  width: 46px;
  place-items: center;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent);
}

.track-status {
  border-radius: 8px;
  background: #F5F6F7;
  padding: .25rem .5rem;
  font-size: .625rem;
  font-weight: 800;
  color: rgba(38, 50, 56, .45);
}

.track-status.is-live { background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); }

.track-cta { color: var(--accent); transition: translate .18s ease; }
.track-card:hover .track-cta { translate: 3px 0; }

.track-bar { height: 6px; border-radius: 999px; background: #F1F3F2; overflow: hidden; }
.track-bar span { display: block; height: 100%; border-radius: 999px; background: var(--accent); transition: width .6s cubic-bezier(.22, 1, .36, 1); }

@media (prefers-reduced-motion: reduce) {
  .track-card, .track-cta, .track-bar span { transition: none; }
}
</style>
