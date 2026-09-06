<script setup lang="ts">
import { useId } from 'vue';

type Tone = 'default' | 'danger';

const props = withDefaults(defineProps<{
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  busy?: boolean;
  /** Backdrop click and Escape close the dialog. Turn off for a step the reader must answer. */
  dismissible?: boolean;
  icon?: string;
}>(), {
  description: '',
  confirmLabel: 'Xác nhận',
  cancelLabel: 'Huỷ',
  tone: 'default',
  busy: false,
  dismissible: true,
  icon: ''
});

const emit = defineEmits<{ confirm: []; cancel: [] }>();

const panel = ref<HTMLElement | null>(null);
const baseId = useId();
const titleId = computed(() => `${baseId}-title`);
const descriptionId = computed(() => `${baseId}-description`);

const toneChip = computed(() => props.tone === 'danger' ? 'bg-blush text-[#B5473A]' : 'bg-mint text-[#46A900]');
const toneIcon = computed(() => props.icon || (props.tone === 'danger' ? 'solar:close-circle-bold' : 'solar:check-circle-bold'));

let lastFocused: HTMLElement | null = null;
let scrollLock = '';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableItems(): HTMLElement[] {
  if (!panel.value) return [];
  return Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => element.getClientRects().length > 0);
}

function cancel() {
  if (props.busy) return;
  emit('cancel');
}

/** Tab stays inside the panel; Escape closes when the dialog allows it. */
function onKeydown(event: KeyboardEvent) {
  if (!props.open) return;
  if (event.key === 'Escape') {
    if (!props.dismissible || props.busy) { event.preventDefault(); return; }
    event.preventDefault();
    cancel();
    return;
  }
  if (event.key !== 'Tab' || !panel.value) return;
  const items = focusableItems();
  if (!items.length) { event.preventDefault(); panel.value.focus(); return; }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  const inside = active ? panel.value.contains(active) : false;
  if (event.shiftKey && (!inside || active === first)) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && (!inside || active === last)) { event.preventDefault(); first.focus(); }
}

function lockScroll() {
  const gap = window.innerWidth - document.documentElement.clientWidth;
  scrollLock = document.body.style.cssText;
  document.body.style.overflow = 'hidden';
  if (gap > 0) document.body.style.paddingRight = `${gap}px`;
}

function releaseScroll() {
  document.body.style.cssText = scrollLock;
  scrollLock = '';
}

watch(() => props.open, async (open) => {
  if (!import.meta.client) return;
  if (open) {
    lastFocused = document.activeElement as HTMLElement | null;
    lockScroll();
    document.addEventListener('keydown', onKeydown);
    await nextTick();
    (focusableItems()[0] ?? panel.value)?.focus();
  } else {
    document.removeEventListener('keydown', onKeydown);
    releaseScroll();
    lastFocused?.focus?.();
    lastFocused = null;
  }
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.removeEventListener('keydown', onKeydown);
  if (scrollLock !== '') releaseScroll();
});
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="open" class="dialog-layer">
          <div class="dialog-backdrop" @click="dismissible && !busy ? cancel() : undefined" />
          <div
            ref="panel"
            class="dialog-panel"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="description ? descriptionId : undefined"
            tabindex="-1"
          >
            <div class="flex items-start gap-4">
              <span :class="['dialog-chip', toneChip]"><AppIcon :icon="toneIcon" :size="22" /></span>
              <div class="min-w-0 flex-1">
                <h2 :id="titleId" class="text-xl font-extrabold tracking-[-0.04em]">{{ title }}</h2>
                <p v-if="description" :id="descriptionId" class="mt-2 text-sm leading-6 text-ink/60">{{ description }}</p>
              </div>
            </div>

            <div v-if="$slots.default" class="mt-5"><slot /></div>

            <div class="dialog-actions">
              <slot name="actions">
                <button class="dialog-cancel focus-ring" :disabled="busy" @click="cancel">{{ cancelLabel }}</button>
                <button
                  :class="['dialog-confirm focus-ring', tone === 'danger' ? 'is-danger' : 'is-default']"
                  :disabled="busy"
                  @click="emit('confirm')"
                >
                  <span v-if="busy" class="dialog-spinner" aria-hidden="true" />
                  {{ busy ? 'Đang xử lý…' : confirmLabel }}
                </button>
              </slot>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.dialog-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(38, 50, 56, .42);
  backdrop-filter: blur(3px);
}

.dialog-panel {
  position: relative;
  width: min(30rem, 100%);
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  border: 1px solid var(--line);
  border-radius: 30px;
  corner-shape: squircle;
  background: var(--paper);
  padding: 1.6rem;
  box-shadow: 0 26px 60px rgba(38, 50, 56, .22);
  outline: none;
}

.dialog-chip {
  display: grid;
  height: 2.9rem;
  width: 2.9rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 20px;
  corner-shape: squircle;
}

.dialog-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: .6rem;
  margin-top: 1.75rem;
}

.dialog-cancel,
.dialog-confirm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  border-radius: 16px;
  corner-shape: squircle;
  padding: .8rem 1.15rem;
  font-size: .8rem;
  font-weight: 800;
  transition: background-color .15s ease, translate .15s ease;
}

.dialog-cancel { border: 1px solid var(--line); background: var(--paper); color: rgba(38, 50, 56, .7); }
.dialog-cancel:hover:not(:disabled) { background: var(--mint); }

.dialog-confirm { color: #fff; }
.dialog-confirm.is-default { background: var(--grass); box-shadow: 0 3px 0 var(--grass-shade); }
.dialog-confirm.is-default:hover:not(:disabled) { background: var(--grass-lift); }
.dialog-confirm.is-danger { background: #E4614C; box-shadow: 0 3px 0 #B5473A; }
.dialog-confirm.is-danger:hover:not(:disabled) { background: #EF7A63; }
.dialog-confirm:active:not(:disabled) { translate: 0 2px; box-shadow: none; }
.dialog-confirm:disabled, .dialog-cancel:disabled { opacity: .55; box-shadow: none; }

.dialog-spinner {
  height: .85rem;
  width: .85rem;
  border-radius: 999px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: dialog-spin .7s linear infinite;
}

@keyframes dialog-spin { to { rotate: 360deg; } }

/* Backdrop fades while the panel rises and settles — the panel leads on the way in, follows on the way out. */
.dialog-enter-active .dialog-backdrop { transition: opacity .26s ease; }
.dialog-leave-active .dialog-backdrop { transition: opacity .18s ease; }
.dialog-enter-from .dialog-backdrop,
.dialog-leave-to .dialog-backdrop { opacity: 0; }

.dialog-enter-active .dialog-panel { transition: opacity .3s cubic-bezier(.22, 1, .36, 1), translate .34s cubic-bezier(.16, 1.1, .3, 1), scale .34s cubic-bezier(.16, 1.1, .3, 1); }
.dialog-leave-active .dialog-panel { transition: opacity .18s ease, translate .18s ease, scale .18s ease; }
.dialog-enter-from .dialog-panel { opacity: 0; translate: 0 18px; scale: .94; }
.dialog-leave-to .dialog-panel { opacity: 0; translate: 0 8px; scale: .97; }

@media (max-width: 480px) {
  .dialog-panel { border-radius: 26px; padding: 1.25rem; }
  .dialog-actions > * { flex: 1 1 auto; }
}
</style>
