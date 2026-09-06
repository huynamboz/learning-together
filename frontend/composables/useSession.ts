import { hasAdminAccess } from '~/utils/admin';

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  plan: string;
};

/**
 * The signed-in account, fetched once and shared. The learner shell needs it to decide what the
 * header offers; the admin console needs it to decide whether to open at all.
 */
export function useSession() {
  const { request, accessToken } = useAppApi();
  const user = useState<SessionUser | null>('session-user', () => null);
  const loaded = useState<boolean>('session-user-loaded', () => false);

  const signedIn = computed(() => Boolean(accessToken.value));
  const isAdmin = computed(() => hasAdminAccess(user.value?.roles));
  const initial = computed(() => (user.value?.displayName || 'Đ').trim().slice(0, 1).toUpperCase());

  async function load() {
    if (!accessToken.value) { user.value = null; loaded.value = true; return; }
    try { user.value = await request<SessionUser>('/users/me'); }
    catch { user.value = null; }
    finally { loaded.value = true; }
  }

  /** Fetch at most once per page load; callers can force a refresh after a profile edit. */
  async function ensureSession() {
    if (loaded.value) return;
    await load();
  }

  return { user, loaded, signedIn, isAdmin, initial, load, ensureSession };
}
