<script setup lang="ts">
import type { ToastTone } from '~/composables/useToast';

const { items, dismiss, pause, resume } = useToast();

const appearance: Record<ToastTone, { icon: string; chip: string; accent: string; role: 'status' | 'alert' }> = {
  success: { icon: 'solar:check-circle-bold', chip: 'bg-grass text-white', accent: 'text-[#46A900]', role: 'status' },
  error: { icon: 'solar:close-circle-bold', chip: 'bg-[#EF7A63] text-white', accent: 'text-[#B5473A]', role: 'alert' },
  info: { icon: 'solar:bell-bing-bold', chip: 'bg-iris text-white', accent: 'text-[#1288C8]', role: 'status' }
};
</script>

<template>
  <ClientOnly>
    <div class="toast-host" aria-live="polite" @mouseenter="pause" @mouseleave="resume" @focusin="pause" @focusout="resume">
      <TransitionGroup name="toast" tag="div" class="toast-stack">
        <div v-for="item in items" :key="item.id" class="toast" :role="appearance[item.tone].role">
          <span :class="['toast-chip', appearance[item.tone].chip]"><AppIcon :icon="appearance[item.tone].icon" :size="18" /></span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-extrabold leading-5">{{ item.title }}</p>
            <p v-if="item.detail" class="mt-1 text-xs leading-5 text-ink/60">{{ item.detail }}</p>
          </div>
          <button class="toast-close focus-ring" :aria-label="`Đóng thông báo: ${item.title}`" @click="dismiss(item.id)">
            <AppIcon icon="solar:close-circle-bold" :size="17" />
          </button>
          <span v-if="item.duration > 0" class="toast-progress" :style="{ '--toast-duration': `${item.duration}ms` }" aria-hidden="true" />
        </div>
      </TransitionGroup>
    </div>
  </ClientOnly>
</template>

<style scoped>
.toast-host {
  position: fixed;
  top: 1rem;
  left: 50%;
  z-index: 60;
  display: flex;
  width: min(26rem, calc(100vw - 2rem));
  translate: -50% 0;
  pointer-events: none;
}

.toast-stack { display: flex; width: 100%; flex-direction: column; gap: .55rem; }

.toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 20px;
  corner-shape: squircle;
  background: var(--paper);
  padding: .85rem 1rem;
  box-shadow: 0 12px 30px rgba(38, 50, 56, .12);
  pointer-events: auto;
}

.toast-chip {
  display: grid;
  height: 2.1rem;
  width: 2.1rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 14px;
  corner-shape: squircle;
}

.toast-close {
  flex-shrink: 0;
  border-radius: 10px;
  color: rgba(38, 50, 56, .45);
  transition: color .15s ease;
}
.toast-close:hover { color: var(--ink); }

.toast-progress {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  height: 3.5px;
  transform-origin: left;
  background: linear-gradient(90deg, var(--grass), var(--iris));
  animation: toast-progress var(--toast-duration) linear forwards;
}
.toast:hover .toast-progress,
.toast:focus-within .toast-progress { animation-play-state: paused; }

@keyframes toast-progress { from { scale: 1 1; } to { scale: 0 1; } }

.toast-enter-active { transition: opacity .28s cubic-bezier(.22, 1, .36, 1), translate .28s cubic-bezier(.22, 1, .36, 1), scale .28s cubic-bezier(.22, 1, .36, 1); }
.toast-leave-active { position: absolute; inset-inline: 0; transition: opacity .18s ease, translate .18s ease, scale .18s ease; }
.toast-enter-from { opacity: 0; translate: 0 -14px; scale: .96; }
.toast-leave-to { opacity: 0; translate: 0 -10px; scale: .97; }
.toast-move { transition: translate .28s cubic-bezier(.22, 1, .36, 1); }

@media (prefers-reduced-motion: reduce) {
  .toast-progress { display: none; }
}
</style>
