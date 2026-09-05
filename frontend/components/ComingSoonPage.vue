<script setup lang="ts">
withDefaults(defineProps<{ eyebrow: string; title: string; description: string; accent?: 'iris' | 'leaf' | 'bean' }>(), { accent: 'iris' });
</script>

<template>
  <section class="page-enter mx-auto max-w-3xl py-8 sm:py-16">
    <div :class="['rounded-[28px] p-7 shadow-soft sm:p-12', accent === 'leaf' ? 'bg-[#E7F7F1]' : accent === 'bean' ? 'bg-[#FFF6DF]' : 'bg-[#E9E9FF]']">
      <p class="text-xs font-extrabold tracking-[0.18em] text-iris">{{ eyebrow }}</p>
      <h1 class="mt-3 max-w-xl text-4xl font-extrabold leading-[1.05] tracking-[-0.06em] sm:text-6xl">{{ title }}</h1>
      <p class="mt-5 max-w-xl text-sm leading-7 text-ink/65 sm:text-base">{{ description }}</p>
      <div class="mt-8 flex flex-wrap gap-3">
        <NuxtLink to="/" class="rounded-xl bg-ink px-4 py-3 text-xs font-extrabold text-white transition hover:bg-iris focus-ring">Về dashboard</NuxtLink>
        <button class="rounded-xl border border-ink/10 bg-white/70 px-4 py-3 text-xs font-extrabold text-ink transition hover:bg-white focus-ring" @click="$router.back()">Quay lại</button>
      </div>
    </div>
  </section>
</template>
