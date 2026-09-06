<script setup lang="ts">
defineProps<{ current: number; total: number; label: string }>();
</script>

<template>
  <section class="relative overflow-hidden rounded-[26px] bg-ink px-6 py-6 text-white shadow-float sm:px-8 sm:py-7">
    <div class="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-iris/35 blur-3xl" aria-hidden="true" />
    <div class="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-xl">
        <div class="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.16em] text-bean"><span class="h-2 w-2 rounded-full bg-bean" /> Hành trình hôm nay</div>
        <h1 class="max-w-[620px] text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.06em]">Mình học tiếp một nhịp nhé.</h1>
        <p class="mt-4 max-w-[440px] text-sm leading-6 text-white/65">{{ label }} — một phiên ngắn cũng đủ giữ đường tiến bộ không bị đứt.</p>
      </div>
      <div class="relative min-w-[260px] lg:w-[370px]">
        <div class="mb-3 flex items-center justify-between text-xs font-semibold text-white/65"><span>Study trail</span><span class="text-white">{{ current }} / {{ total }} mốc</span></div>
        <div class="relative h-2 rounded-full bg-white/15"><div class="absolute inset-y-0 left-0 rounded-full bg-bean transition-all duration-700" :style="{ width: `${(current / total) * 100}%` }" /></div>
        <div class="mt-4 flex justify-between text-[10px] font-semibold text-white/45"><span>Khởi động</span><span>Vào guồng</span><span>Về đích</span></div>
      </div>
    </div>
  </section>
</template>
