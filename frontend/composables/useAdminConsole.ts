import type { AdminOverview } from '~/utils/admin';
import { hasAdminAccess } from '~/utils/admin';

type AdminProfile = { id: string; email: string; displayName: string; roles: string[] };

/**
 * Console-wide state. The rail badge, the access gate and every module read the same
 * overview snapshot instead of each route refetching it on navigation.
 */
export function useAdminConsole() {
  const { request, accessToken } = useAppApi();
  const toast = useToast();
  const overview = useState<AdminOverview | null>('admin-overview', () => null);
  const profile = useState<AdminProfile | null>('admin-profile', () => null);
  const overviewLoading = useState<boolean>('admin-overview-loading', () => false);
  const profileLoaded = useState<boolean>('admin-profile-loaded', () => false);

  const signedIn = computed(() => Boolean(accessToken.value));
  const canAccess = computed(() => hasAdminAccess(profile.value?.roles));
  const pendingReviews = computed(() => overview.value?.writing.GRADING ?? 0);

  async function loadProfile() {
    if (!accessToken.value) { profileLoaded.value = true; return; }
    try { profile.value = await request<AdminProfile>('/users/me'); }
    catch { profile.value = null; }
    finally { profileLoaded.value = true; }
  }

  async function loadOverview() {
    if (!accessToken.value) return;
    overviewLoading.value = true;
    try { overview.value = await request<AdminOverview>('/admin/overview'); }
    catch { toast.error('Không tải được số liệu vận hành', 'Cần tài khoản có quyền admin hoặc moderator.'); }
    finally { overviewLoading.value = false; }
  }

  /** Called by every module page so the rail badge stays accurate after a mutation. */
  async function ensureConsole() {
    if (!profileLoaded.value) await loadProfile();
    if (canAccess.value && !overview.value) await loadOverview();
  }

  return { overview, profile, overviewLoading, signedIn, canAccess, profileLoaded, pendingReviews, loadProfile, loadOverview, ensureConsole };
}
