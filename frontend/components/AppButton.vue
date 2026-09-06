<script setup lang="ts">
type Variant = 'primary' | 'accent' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(defineProps<{
  variant?: Variant;
  size?: Size;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  disabled?: boolean;
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false
});

const classes = computed(() => [
  'app-button inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold transition focus-ring disabled:cursor-not-allowed disabled:opacity-45',
  props.size === 'sm' ? 'px-3 py-2 text-xs' : props.size === 'lg' ? 'px-5 py-3.5 text-sm' : 'px-4 py-3 text-xs',
  props.variant === 'accent' ? 'bg-iris text-white hover:bg-[#1288C8]' : '',
  props.variant === 'secondary' ? 'border border-line bg-white text-ink/70 hover:border-iris/45 hover:bg-paper' : '',
  props.variant === 'ghost' ? 'text-ink/60 hover:bg-paper hover:text-ink' : '',
  props.variant === 'primary' ? 'bg-ink text-white hover:bg-iris' : ''
]);
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading">
    <span v-if="loading" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
    <slot />
  </button>
</template>
