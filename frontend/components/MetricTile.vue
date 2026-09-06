<script setup lang="ts">
type Tone = 'plain' | 'bean' | 'leaf' | 'iris';

const props = withDefaults(defineProps<{ eyebrow: string; value: string; caption: string; icon: string; tone?: Tone }>(), { tone: 'plain' });

const surface: Record<Tone, string> = {
  iris: 'bg-azure',
  leaf: 'bg-mint',
  bean: 'bg-sun',
  plain: 'bg-blush'
};

const chip: Record<Tone, string> = {
  iris: 'bg-iris text-white',
  leaf: 'bg-grass text-white',
  bean: 'bg-bean text-white',
  plain: 'bg-[#EF7A63] text-white'
};

const accent: Record<Tone, string> = {
  iris: 'text-[#1288C8]',
  leaf: 'text-[#46A900]',
  bean: 'text-[#8B6400]',
  plain: 'text-[#B5473A]'
};
</script>

<template>
  <article :class="['rounded-2xl p-5 transition duration-300 hover:-translate-y-1', surface[props.tone]]">
    <div class="flex items-center justify-between gap-3">
      <span :class="['text-xs font-extrabold', accent[props.tone]]">{{ eyebrow }}</span>
      <span :class="['grid h-9 w-9 shrink-0 place-items-center rounded-xl', chip[props.tone]]"><AppIcon :icon="icon" :size="19" /></span>
    </div>
    <div class="mt-5 text-[2.1rem] font-extrabold leading-none tracking-[-0.06em]">{{ value }}</div>
    <div class="mt-2 text-xs leading-5 text-ink/60">{{ caption }}</div>
  </article>
</template>
