<script setup lang="ts">
withDefaults(defineProps<{ eyebrow: string; value: string; caption: string; tone?: 'plain' | 'bean' | 'leaf' | 'iris' }>(), { tone: 'plain' });
</script>

<template>
  <article class="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-float">
    <div class="mb-6 flex items-start justify-between"><span class="text-xs font-bold text-ink/55">{{ eyebrow }}</span><span :class="['h-2.5 w-2.5 rounded-full', tone === 'bean' ? 'bg-bean' : tone === 'leaf' ? 'bg-leaf' : tone === 'iris' ? 'bg-iris' : 'bg-ink/15']" /></div>
    <div class="text-3xl font-extrabold tracking-[-0.06em]">{{ value }}</div>
    <div class="mt-1 text-xs leading-5 text-ink/50">{{ caption }}</div>
  </article>
</template>
