<script setup lang="ts">
/**
 * The mark is a C that is also an unfinished progress ring: the stroke stops short and a gold
 * dot sits where the learner has got to. It carries the initial and the study-trail idea at once.
 *
 * Geometry here matches public/brand/*.svg and scripts/build-brand-assets.mjs — change one,
 * change all three.
 */
type Tone = 'dark' | 'light' | 'transparent' | 'mono-ink' | 'mono-white';

const props = withDefaults(defineProps<{
  size?: number;
  /** `lockup` adds the wordmark; `mark` is the tile alone, for tight spaces and favicons. */
  variant?: 'mark' | 'lockup';
  /** Which mark variant to draw. `dark` is the default tile for light surfaces. */
  tone?: Tone;
  /** Flips the wordmark for dark surfaces such as the admin rail. */
  onDark?: boolean;
}>(), { size: 36, variant: 'lockup', tone: 'dark', onDark: false });

const INK = '#263238';
const GRASS = '#58CC02';
const GOLD = '#F4B942';
const WHITE = '#FFFFFF';

const palette = computed(() => ({
  dark: { tile: INK, stroke: GRASS, dot: GOLD },
  light: { tile: WHITE, stroke: GRASS, dot: GOLD },
  transparent: { tile: '', stroke: GRASS, dot: GOLD },
  'mono-ink': { tile: '', stroke: INK, dot: INK },
  'mono-white': { tile: '', stroke: WHITE, dot: WHITE }
}[props.tone]));
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
      <rect v-if="palette.tile" width="40" height="40" rx="11.5" :fill="palette.tile" />
      <path
        d="M26.02 11.40 A 10.5 10.5 0 1 0 26.02 28.60"
        fill="none"
        :stroke="palette.stroke"
        stroke-width="4.2"
        stroke-linecap="round"
      />
      <circle cx="26.02" cy="11.40" r="2.9" :fill="palette.dot" />
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
