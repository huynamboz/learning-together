import type { AdminOverview } from '~/utils/admin';

/**
 * Console-wide state. The rail badge, the access gate and every module read the same
 * overview snapshot instead of each route refetching it on navigation.
 */
export function useAdminConsole() {
  const { request, accessToken } = useAppApi();
  const toast = useToast();
  // One account fetch for the whole app: the header and the console read the same session.
  const { user: profile, loaded: profileLoaded, signedIn, isAdmin: canAccess, ensureSession } = useSession();
  const overview = useState<AdminOverview | null>('admin-overview', () => null);
  const overviewLoading = useState<boolean>('admin-overview-loading', () => false);

  const pendingReviews = computed(() => overview.value?.writing.GRADING ?? 0);

  async function loadOverview() {
    if (!accessToken.value) return;
    overviewLoading.value = true;
    try { overview.value = await request<AdminOverview>('/admin/overview'); }
    catch { toast.error('Không tải được số liệu vận hành', 'Cần tài khoản có quyền admin hoặc moderator.'); }
    finally { overviewLoading.value = false; }
  }

  /** Called by every module page so the rail badge stays accurate after a mutation. */
  async function ensureConsole() {
    await ensureSession();
    if (canAccess.value && !overview.value) await loadOverview();
  }

  return { overview, profile, overviewLoading, signedIn, canAccess, profileLoaded, pendingReviews, loadOverview, ensureConsole };
}
