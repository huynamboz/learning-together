export type ConfirmRequest = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  icon?: string;
};

/**
 * The resolver and the optional action are functions, so they stay in module scope
 * instead of the serialisable Nuxt state the dialog renders from.
 */
let resolver: ((value: boolean) => void) | null = null;
let action: (() => Promise<unknown>) | null = null;

export function useConfirm() {
  const request = useState<ConfirmRequest | null>('app-confirm-request', () => null);
  const busy = useState<boolean>('app-confirm-busy', () => false);

  /**
   * `await confirm({ ... })` resolves to the reader's answer.
   * Pass `run` to keep the dialog open — with its button in a busy state — until the
   * work settles, so a destructive action cannot be fired twice.
   */
  function confirm(next: ConfirmRequest, run?: () => Promise<unknown>): Promise<boolean> {
    resolver?.(false);
    request.value = next;
    busy.value = false;
    action = run ?? null;
    return new Promise<boolean>((resolve) => { resolver = resolve; });
  }

  function settle(value: boolean) {
    request.value = null;
    busy.value = false;
    action = null;
    const resolve = resolver;
    resolver = null;
    resolve?.(value);
  }

  async function accept() {
    if (busy.value) return;
    if (!action) { settle(true); return; }
    busy.value = true;
    try { await action(); }
    finally { settle(true); }
  }

  function reject() {
    if (busy.value) return;
    settle(false);
  }

  return { request, busy, confirm, accept, reject };
}
