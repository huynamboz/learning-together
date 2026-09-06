<script setup lang="ts">
defineProps<{ eyebrow: string; title: string; description: string }>();
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
    <div class="min-w-0">
      <p class="text-xs font-extrabold text-iris">{{ eyebrow }}</p>
      <h1 class="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">{{ title }}</h1>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-ink/55">{{ description }}</p>
    </div>
    <div v-if="$slots.aside" class="flex shrink-0 items-stretch gap-2"><slot name="aside" /></div>
  </div>
</template>
