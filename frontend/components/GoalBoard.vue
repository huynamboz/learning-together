<script setup lang="ts">
const settingsOpen = ref(false);
const goals = [
  { label: 'Đọc', value: '0 / 30 câu', color: 'bg-iris', icon: '▦' },
  { label: 'Nghe', value: '0 / 30 câu', color: 'bg-leaf', icon: '◌' },
  { label: 'Từ vựng', value: '0 / 20 từ', color: 'bg-bean', icon: '▤' },
  { label: 'Luyện đề', value: '0 / 40 câu', color: 'bg-ink', icon: '▥' },
  { label: 'Video', value: '0 / 2 bài', color: 'bg-[#D783B8]', icon: '▷' }
];
</script>

<template>
  <section class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6">
    <div class="flex items-start justify-between gap-4"><div><p class="text-xs font-bold text-ink/45">NHỊP HỌC</p><h2 class="mt-1 text-xl font-extrabold tracking-[-0.04em]">Mục tiêu hôm nay</h2></div><button class="rounded-lg px-2 py-1 text-xs font-bold text-iris hover:bg-iris/5 focus-ring" :aria-expanded="settingsOpen" @click="settingsOpen = !settingsOpen">Cài đặt</button></div>
    <div v-if="settingsOpen" class="mt-4 rounded-2xl bg-paper p-4" role="status"><p class="text-xs font-bold">Mục tiêu mặc định</p><p class="mt-1 text-xs leading-5 text-ink/55">30 câu nghe · 30 câu đọc · 20 từ · 40 câu đề · 2 video. Tuỳ chỉnh sẽ được lưu khi có tài khoản.</p></div>
    <div class="mt-6 space-y-4">
      <div v-for="goal in goals" :key="goal.label" class="flex items-center gap-3"><span :class="['grid h-9 w-9 place-items-center rounded-xl text-sm text-white', goal.color]">{{ goal.icon }}</span><div class="min-w-0 flex-1"><div class="flex justify-between gap-2 text-xs font-bold"><span>{{ goal.label }}</span><span class="text-ink/45">{{ goal.value }}</span></div><div class="mt-2 h-1.5 rounded-full bg-paper"><div class="h-full w-0 rounded-full" :class="goal.color" /></div></div></div>
    </div>
  </section>
</template>
