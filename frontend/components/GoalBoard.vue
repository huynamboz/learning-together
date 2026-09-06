<script setup lang="ts">
type Goal = { key: string; label: string; target: number; achieved: number; unit: string; icon: string; tone: 'leaf' | 'iris' | 'bean' | 'ink' | 'pink'; to: string };

defineProps<{ goals: Goal[]; loading?: boolean }>();

function valueLabel(goal: Goal) {
  if (goal.unit === 'giây') return `${Math.floor(goal.achieved / 60)} / ${Math.floor(goal.target / 60)} phút`;
  return `${goal.achieved} / ${goal.target} ${goal.unit}`;
}

function width(goal: Goal) { return `${Math.min(100, Math.round((goal.achieved / goal.target) * 100))}%`; }

function toneClass(tone: Goal['tone']) {
  return { leaf: 'bg-leaf', iris: 'bg-iris', bean: 'bg-bean', ink: 'bg-ink', pink: 'bg-[#D783B8]' }[tone];
}
</script>

<template>
  <section class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6">
    <div class="flex items-start justify-between gap-4"><div><p class="text-xs font-bold text-ink/45">NHỊP HỌC</p><h2 class="mt-1 text-xl font-extrabold tracking-[-0.04em]">Mục tiêu hôm nay</h2></div><span class="rounded-lg bg-paper px-2 py-1 text-[11px] font-bold text-ink/45">UTC</span></div>
    <p class="mt-3 text-xs leading-5 text-ink/55">Mục tiêu mặc định được tính từ hoạt động đã lưu, không phải số ước lượng.</p>
    <div v-if="loading" class="mt-6 rounded-2xl bg-paper p-4 text-xs text-ink/55">Đang tính nhịp học hôm nay...</div>
    <div v-else-if="goals.length" class="mt-6 space-y-4">
      <NuxtLink v-for="goal in goals" :key="goal.key" :to="goal.to" class="group flex items-center gap-3 rounded-xl p-1 transition hover:bg-paper focus-ring">
        <span :class="['grid h-9 w-9 place-items-center rounded-xl text-white', toneClass(goal.tone)]"><AppIcon :icon="goal.icon" :size="20" /></span>
        <span class="min-w-0 flex-1"><span class="flex justify-between gap-2 text-xs font-bold"><span>{{ goal.label }}</span><span class="text-ink/45">{{ valueLabel(goal) }}</span></span><span class="mt-2 block h-1.5 overflow-hidden rounded-full bg-paper"><span :class="['block h-full rounded-full transition-all', toneClass(goal.tone)]" :style="{ width: width(goal) }" /></span></span>
      </NuxtLink>
    </div>
    <p v-else-if="!loading" class="mt-6 rounded-2xl bg-paper p-4 text-xs leading-5 text-ink/55">Đăng nhập để xem mục tiêu theo hoạt động của bạn.</p>
  </section>
</template>
