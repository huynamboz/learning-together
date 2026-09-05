<script setup lang="ts">
const quickLinks = [
  { label: 'Tiếp tục Listening', detail: 'Part 1 · Tranh cảnh vật', to: '/listen', tone: 'leaf', icon: '◌' },
  { label: 'Ôn Grammar', detail: 'Ngữ pháp cơ bản', to: '/read?mode=grammar', tone: 'iris', icon: '▦' },
  { label: 'Học từ vựng', detail: '600 từ TOEIC', to: '/vocabulary', tone: 'bean', icon: '▤' },
  { label: 'Làm một mini test', detail: '10 phút · 20 câu', to: '/mock-test', tone: 'ink', icon: '▥' }
];
</script>

<template>
  <div class="page-enter space-y-6">
    <StudyTrail :current="1" :total="5" label="Streak 1 ngày · 5 XP trọn đời" />
    <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MetricTile eyebrow="Điểm hiện tại" value="—" caption="Làm một đề để bắt đầu" tone="iris" /><MetricTile eyebrow="Điểm mục tiêu" value="—" caption="Chọn preset 500–900" tone="leaf" /><MetricTile eyebrow="Ngày thi" value="Chưa đặt" caption="Thêm ngày thi dự kiến" tone="bean" /><MetricTile eyebrow="Chuỗi ngày" value="1 ngày" caption="Dài nhất: 1 ngày" tone="plain" /></section>
    <div class="grid gap-6 lg:grid-cols-[1.35fr_.85fr]"><section class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6"><div class="flex items-end justify-between gap-4"><div><p class="text-xs font-bold text-ink/45">BẮT ĐẦU NHẸ</p><h2 class="mt-1 text-xl font-extrabold tracking-[-0.04em]">Chọn một nhịp học</h2></div><NuxtLink to="/listen" class="text-xs font-bold text-iris hover:underline focus-ring">Xem tất cả</NuxtLink></div><div class="mt-5 grid gap-3 sm:grid-cols-2"><NuxtLink v-for="link in quickLinks" :key="link.to" :to="link.to" class="group relative overflow-hidden rounded-2xl border border-line p-4 transition duration-300 hover:-translate-y-1 hover:border-iris/30 hover:shadow-soft focus-ring"><span :class="['mb-8 grid h-10 w-10 place-items-center rounded-xl text-lg', link.tone === 'leaf' ? 'bg-leaf/15 text-leaf' : link.tone === 'iris' ? 'bg-iris/10 text-iris' : link.tone === 'bean' ? 'bg-bean/20 text-[#A87400]' : 'bg-ink text-white']">{{ link.icon }}</span><span class="block text-sm font-extrabold">{{ link.label }}</span><span class="mt-1 block text-xs text-ink/45">{{ link.detail }}</span><span class="absolute bottom-4 right-4 text-lg text-ink/20 transition group-hover:translate-x-1 group-hover:text-iris">↗</span></NuxtLink></div></section><GoalBoard /></div>
    <div class="grid gap-6 lg:grid-cols-2"><ActivityTimeline /><section class="relative overflow-hidden rounded-[22px] bg-[#E9E9FF] p-6 shadow-soft"><div class="relative z-10 max-w-sm"><p class="text-xs font-bold text-iris/75">MẸO NHỎ CỦA ĐẬU</p><h2 class="mt-2 text-2xl font-extrabold leading-tight tracking-[-0.05em]">Nghe lại một câu khó, nhưng nghe đúng cách.</h2><p class="mt-3 text-sm leading-6 text-ink/60">Thử nghe không nhìn transcript, đoán ý chính, rồi mới bật phụ đề để soi chỗ nối âm.</p><NuxtLink to="/listen?mode=dictation" class="mt-6 inline-flex rounded-xl bg-ink px-4 py-3 text-xs font-bold text-white transition hover:bg-iris focus-ring">Luyện nghe chép</NuxtLink></div><div class="absolute -bottom-20 -right-8 h-56 w-56 rounded-full border-[26px] border-white/70" aria-hidden="true" /><div class="absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-bean/70" aria-hidden="true" /></section></div>
  </div>
</template>
