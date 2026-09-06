<script setup lang="ts">
/**
 * The mark is a C that is also an unfinished progress ring: the stroke stops short and a gold
 * dot sits where the learner has got to. It carries the initial and the study-trail idea at once.
 */
withDefaults(defineProps<{
  size?: number;
  /** `lockup` adds the wordmark; `mark` is the tile alone, for tight spaces and favicons. */
  variant?: 'mark' | 'lockup';
  /** `onDark` flips the wordmark for the admin rail. */
  onDark?: boolean;
}>(), { size: 36, variant: 'lockup', onDark: false });
</script>

<template>
  <span :class="['logo', onDark ? 'is-on-dark' : '']">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 40 40"
      role="img"
      aria-label="Ms Chole TOEIC"
      class="logo-mark"
    >
      <rect width="40" height="40" rx="11.5" fill="#263238" />
      <path
        d="M26.02 11.40 A 10.5 10.5 0 1 0 26.02 28.60"
        fill="none"
        stroke="#58CC02"
        stroke-width="4.2"
        stroke-linecap="round"
      />
      <circle cx="26.02" cy="11.40" r="2.9" fill="#F4B942" />
    </svg>

    <span v-if="variant === 'lockup'" class="logo-words">
      <span class="logo-name">Ms Chole</span>
      <span class="logo-suffix">TOEIC</span>
    </span>
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  gap: .6rem;
  min-width: 0;
}

.logo-mark { display: block; flex-shrink: 0; }

.logo-words {
  display: flex;
  align-items: baseline;
  gap: .35rem;
  min-width: 0;
}

.logo-name {
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -.035em;
  color: var(--ink);
  white-space: nowrap;
}

.logo-suffix {
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .14em;
  color: rgba(38, 50, 56, .45);
  white-space: nowrap;
}

.is-on-dark .logo-name { color: #fff; }
.is-on-dark .logo-suffix { color: rgba(255, 255, 255, .5); }
</style>
