<script setup lang="ts">
const activities = [
  { icon: '◌', title: 'Listening', text: 'Chưa có phiên học hôm nay', color: 'text-leaf bg-leaf/10', to: '/listen' },
  { icon: '▦', title: 'Reading', text: 'Chọn một bài để bắt đầu', color: 'text-iris bg-iris/10', to: '/read' },
  { icon: '▤', title: 'Từ vựng', text: 'Ôn 20 từ mới', color: 'text-[#A87400] bg-bean/20', to: '/vocabulary' }
];
</script>

<template>
  <section class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6"><div class="flex items-start justify-between"><div><p class="text-xs font-bold text-ink/45">DÒNG THỜI GIAN</p><h2 class="mt-1 text-xl font-extrabold tracking-[-0.04em]">Gợi ý tiếp theo</h2></div><span class="rounded-lg bg-paper px-2 py-1 text-[11px] font-bold text-ink/45">Hôm nay</span></div><div class="mt-5 space-y-2"><NuxtLink v-for="activity in activities" :key="activity.title" :to="activity.to" class="group flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-paper focus-ring"><span :class="['grid h-10 w-10 place-items-center rounded-xl text-lg', activity.color]">{{ activity.icon }}</span><span class="min-w-0 flex-1"><span class="block text-sm font-bold">{{ activity.title }}</span><span class="block truncate text-xs text-ink/50">{{ activity.text }}</span></span><span class="text-lg text-ink/25 transition group-hover:translate-x-1 group-hover:text-iris">→</span></NuxtLink></div></section>
</template>
