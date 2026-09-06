<script setup lang="ts">
import type { LessonSummary } from '~/utils/catalog';
import { lessonMeta } from '~/utils/catalog';

type Tone = 'leaf' | 'iris' | 'bean' | 'grass';

const props = withDefaults(defineProps<{
  lessons: LessonSummary[];
  /** Where a row goes when opened. */
  href: (lesson: LessonSummary) => string;
  loading?: boolean;
  icon?: string;
  tone?: Tone;
  actionLabel?: string;
  emptyTitle?: string;
  emptyDetail?: string;
}>(), {
  loading: false,
  icon: 'solar:book-2-bold',
  tone: 'iris',
  actionLabel: 'Luyện tập',
  emptyTitle: 'Chưa có bài nào được publish',
  emptyDetail: 'Nội dung xuất hiện ở đây ngay khi admin publish trong console.'
});

const chip: Record<Tone, string> = {
  leaf: 'bg-mint text-[#46A900]',
  iris: 'bg-azure text-[#1288C8]',
  bean: 'bg-sun text-[#A87400]',
  grass: 'bg-grass text-white'
};
</script>

<template>
  <div>
    <ul v-if="lessons.length" class="space-y-2.5">
      <li v-for="lesson in lessons" :key="lesson.id">
        <NuxtLink :to="props.href(lesson)" class="lesson-row focus-ring">
          <span :class="['lesson-icon', chip[props.tone]]"><AppIcon :icon="props.icon" :size="21" /></span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-extrabold leading-5">{{ lesson.title }}</span>
            <span v-if="lesson.summary" class="mt-1 line-clamp-2 block text-xs leading-5 text-ink/55">{{ lesson.summary }}</span>
            <span v-if="lessonMeta(lesson).length" class="mt-2 flex flex-wrap gap-1.5">
              <span v-for="meta in lessonMeta(lesson)" :key="meta" class="rounded-lg bg-mint px-2 py-0.5 text-[11px] font-bold text-ink/55">{{ meta }}</span>
            </span>
          </span>
          <span class="lesson-action">{{ props.actionLabel }} <AppIcon icon="solar:arrow-right-linear" :size="16" /></span>
        </NuxtLink>
      </li>
    </ul>

    <div v-else-if="loading" class="rounded-2xl bg-mint p-6 text-sm text-ink/55">Đang tải danh sách bài…</div>

    <div v-else class="rounded-2xl bg-mint p-6">
      <p class="text-sm font-extrabold">{{ emptyTitle }}</p>
      <p class="mt-1.5 text-xs leading-5 text-ink/55">{{ emptyDetail }}</p>
    </div>
  </div>
</template>

<style scoped>
.lesson-row {
  display: flex;
  align-items: flex-start;
  gap: .9rem;
  border: 1px solid var(--line);
  border-radius: 18px;
  corner-shape: squircle;
  padding: 1rem;
  transition: border-color .18s ease, background-color .18s ease, translate .18s ease;
}
.lesson-row:hover { border-color: rgba(28, 176, 246, .45); background: var(--mint); translate: 0 -2px; }

.lesson-icon {
  display: grid;
  height: 2.6rem;
  width: 2.6rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 16px;
  corner-shape: squircle;
}

.lesson-action {
  display: none;
  flex-shrink: 0;
  align-items: center;
  gap: .35rem;
  align-self: center;
  border-radius: 12px;
  background: var(--mint);
  padding: .5rem .75rem;
  font-size: .7rem;
  font-weight: 800;
  color: var(--iris);
}

@media (min-width: 640px) { .lesson-action { display: inline-flex; } }
</style>
