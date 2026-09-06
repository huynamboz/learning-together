export type ToastTone = 'success' | 'error' | 'info';

export type ToastItem = {
  id: number;
  tone: ToastTone;
  title: string;
  detail?: string;
  /** Milliseconds the toast stays up. 0 keeps it until the reader dismisses it. */
  duration: number;
};

type Countdown = { handle: ReturnType<typeof setTimeout> | null; startedAt: number; remaining: number };

/** Timers live outside the reactive store: they are per-tab machinery, not state to render. */
const countdowns = new Map<number, Countdown>();
const MAX_VISIBLE = 4;
const DEFAULT_DURATION: Record<ToastTone, number> = { success: 4000, info: 5000, error: 7000 };

export function useToast() {
  const items = useState<ToastItem[]>('app-toasts', () => []);
  const sequence = useState<number>('app-toast-sequence', () => 0);

  function clearCountdown(id: number) {
    const countdown = countdowns.get(id);
    if (countdown?.handle) clearTimeout(countdown.handle);
    countdowns.delete(id);
  }

  function dismiss(id: number) {
    clearCountdown(id);
    items.value = items.value.filter((item) => item.id !== id);
  }

  function startCountdown(id: number, duration: number) {
    if (!import.meta.client || duration <= 0) return;
    countdowns.set(id, { handle: setTimeout(() => dismiss(id), duration), startedAt: Date.now(), remaining: duration });
  }

  /** Hover freezes the countdown so a reader is never cut off mid-sentence. */
  function pause() {
    const now = Date.now();
    countdowns.forEach((countdown) => {
      if (!countdown.handle) return;
      clearTimeout(countdown.handle);
      countdown.remaining = Math.max(0, countdown.remaining - (now - countdown.startedAt));
      countdown.handle = null;
    });
  }

  function resume() {
    const now = Date.now();
    countdowns.forEach((countdown, id) => {
      if (countdown.handle || countdown.remaining <= 0) return;
      countdown.startedAt = now;
      countdown.handle = setTimeout(() => dismiss(id), countdown.remaining);
    });
  }

  function push(tone: ToastTone, title: string, detail?: string, duration?: number) {
    sequence.value += 1;
    const id = sequence.value;
    const life = duration ?? DEFAULT_DURATION[tone];
    const next = nextToastStack(items.value, { id, tone, title, detail, duration: life });
    // Anything pushed off the bottom of the stack must not keep a live countdown.
    items.value.filter((item) => !next.includes(item)).forEach((item) => clearCountdown(item.id));
    items.value = next;
    startCountdown(id, life);
    return id;
  }

  function clear() {
    items.value.forEach((item) => clearCountdown(item.id));
    items.value = [];
  }

  return {
    items,
    dismiss,
    pause,
    resume,
    clear,
    success: (title: string, detail?: string, duration?: number) => push('success', title, detail, duration),
    error: (title: string, detail?: string, duration?: number) => push('error', title, detail, duration),
    info: (title: string, detail?: string, duration?: number) => push('info', title, detail, duration)
  };
}

/** Pure helper kept separate so the stack rules stay unit-testable. */
export function nextToastStack(current: ToastItem[], incoming: ToastItem, maxVisible = MAX_VISIBLE): ToastItem[] {
  return [...current, incoming].slice(-maxVisible);
}

export const toastDefaults = DEFAULT_DURATION;
export const toastMaxVisible = MAX_VISIBLE;
