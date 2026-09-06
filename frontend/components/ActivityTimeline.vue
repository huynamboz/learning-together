<script setup lang="ts">
type Activity = { kind: string; surface: string; quantity: number; isCorrect?: boolean; correct?: number; occurredAt: string };
type NextAction = { surface: string; to: string; title: string; detail: string };

const props = defineProps<{ activities: Activity[]; nextAction?: NextAction; loading?: boolean }>();

const labels: Record<string, { title: string; icon: string; color: string }> = {
  listening: { title: 'Listening', icon: 'solar:headphones-round-sound-bold', color: 'text-leaf bg-leaf/10' },
  reading: { title: 'Reading', icon: 'solar:book-2-bold', color: 'text-iris bg-iris/10' },
  practice: { title: 'Reading', icon: 'solar:book-2-bold', color: 'text-iris bg-iris/10' },
  vocabulary: { title: 'Từ vựng', icon: 'solar:book-bookmark-bold', color: 'text-[#A87400] bg-bean/20' },
  'mock-test': { title: 'Luyện đề', icon: 'solar:clipboard-list-bold', color: 'text-white bg-ink' },
  exam: { title: 'Luyện đề', icon: 'solar:clipboard-list-bold', color: 'text-white bg-ink' },
  video: { title: 'Video', icon: 'solar:play-circle-bold', color: 'text-[#1288C8] bg-[#E8F7FF]' }
};

function meta(activity: Activity) {
  if (activity.kind === 'study') return `${Math.max(1, Math.round(activity.quantity / 60))} phút đã học`;
  if (activity.kind === 'vocabulary') return 'Đã ôn một thẻ SRS';
  if (activity.kind === 'exam') return `${activity.correct ?? 0}/${activity.quantity} câu đúng`;
  return activity.isCorrect ? 'Trả lời đúng' : 'Đã lưu một lần trả lời';
}

function timeLabel(value: string) { return new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }); }
function appearance(surface: string) { return labels[surface] ?? { title: 'Học tập', icon: 'solar:book-2-bold', color: 'text-ink bg-paper' }; }
</script>

<template>
  <section class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6">
    <div class="flex items-start justify-between"><div><p class="text-xs font-bold text-ink/45">DÒNG THỜI GIAN</p><h2 class="mt-1 text-xl font-extrabold tracking-[-0.04em]">Gợi ý tiếp theo</h2></div><span class="rounded-lg bg-paper px-2 py-1 text-[11px] font-bold text-ink/45">Hôm nay</span></div>
    <NuxtLink v-if="nextAction" :to="nextAction.to" class="mt-5 block rounded-2xl bg-[#E8F7FF] p-4 transition hover:bg-iris/15 focus-ring"><p class="text-[11px] font-extrabold text-iris">BƯỚC TIẾP THEO</p><p class="mt-1 text-sm font-extrabold">{{ nextAction.title }}</p><p class="mt-1 text-xs leading-5 text-ink/60">{{ nextAction.detail }}</p></NuxtLink>
    <div v-if="loading" class="mt-4 rounded-2xl bg-paper p-4 text-xs text-ink/55">Đang tải hoạt động gần đây...</div>
    <div v-else-if="activities.length" class="mt-4 space-y-2"><div v-for="activity in activities" :key="`${activity.kind}-${activity.occurredAt}-${activity.quantity}`" class="flex items-center gap-3 rounded-2xl p-2"><span :class="['grid h-10 w-10 place-items-center rounded-xl', appearance(activity.surface).color]"><AppIcon :icon="appearance(activity.surface).icon" :size="20" /></span><span class="min-w-0 flex-1"><span class="block text-sm font-bold">{{ appearance(activity.surface).title }}</span><span class="block truncate text-xs text-ink/50">{{ meta(activity) }}</span></span><span class="text-[10px] font-bold text-ink/35">{{ timeLabel(activity.occurredAt) }}</span></div></div>
    <p v-else-if="!loading" class="mt-4 rounded-2xl bg-paper p-4 text-xs leading-5 text-ink/55">Hoạt động đã lưu sẽ xuất hiện ở đây sau phiên học đầu tiên.</p>
  </section>
</template>
