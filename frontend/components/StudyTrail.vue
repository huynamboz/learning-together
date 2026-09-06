<script setup lang="ts">
defineProps<{
  current: number;
  total: number;
  streak: number | null;
  xp: number | null;
  actionTo: string;
  actionLabel: string;
  actionDetail: string;
}>();

const milestones = ['Khởi động', 'Vào nhịp', 'Giữa chặng', 'Tăng tốc', 'Về đích'];
</script>

<template>
  <section class="keeps-surface home-hero relative overflow-hidden rounded-[26px] bg-mint px-6 py-7 sm:px-9 sm:py-9">
    <div class="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
      <div class="min-w-0">
        <p class="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#46A900]">
          <span class="h-2 w-2 rounded-full bg-grass" aria-hidden="true" /> Hành trình hôm nay
        </p>
        <h1 class="mt-3 text-[clamp(2.1rem,4.4vw,3.4rem)] font-extrabold leading-[1.03] tracking-[-0.06em]">Mình học tiếp một nhịp nhé.</h1>
        <p class="mt-3 max-w-[440px] text-sm leading-6 text-ink/65">{{ actionDetail }}</p>

        <div class="mt-6 flex flex-wrap items-center gap-2.5">
          <span class="inline-flex items-center gap-2 rounded-2xl bg-sun px-3.5 py-2.5 text-sm font-extrabold text-[#8B6400]">
            <AppIcon icon="solar:fire-bold" :size="18" /> {{ streak ?? '—' }} ngày streak
          </span>
          <span class="inline-flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-sm font-extrabold text-[#46A900]">
            <AppIcon icon="solar:bolt-circle-bold" :size="18" /> {{ xp ?? '—' }} XP
          </span>
          <NuxtLink :to="actionTo" class="cta-grass inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold focus-ring">
            {{ actionLabel }} <AppIcon icon="solar:arrow-right-linear" :size="17" />
          </NuxtLink>
        </div>
      </div>

      <div class="rounded-[22px] bg-white p-5">
        <div class="flex items-baseline justify-between">
          <span class="text-xs font-extrabold text-ink/55">Study trail</span>
          <span class="text-sm font-extrabold text-ink">{{ current }} / {{ total }} mốc</span>
        </div>
        <ol class="mt-5 flex items-center gap-1.5" :aria-label="`Đã đạt ${current} trên ${total} mốc hôm nay`">
          <li v-for="(name, index) in milestones" :key="name" class="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span :class="['h-2.5 w-full rounded-full transition-all duration-500', index < current ? 'bg-grass' : 'bg-mint']" />
            <span :class="['truncate text-[10px] font-bold', index < current ? 'text-[#46A900]' : 'text-ink/35']">{{ name }}</span>
          </li>
        </ol>
        <p class="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink/55">Mỗi mục tiêu hoàn thành sẽ thắp thêm một mốc trên đường học hôm nay.</p>
      </div>
    </div>
    <div class="absolute -bottom-24 -right-10 h-60 w-60 rounded-full border-[26px] border-white/60" aria-hidden="true" />
  </section>
</template>
