export type AdminSection = {
  key: string;
  label: string;
  detail: string;
  icon: string;
  to: string;
};

export const adminSections: ReadonlyArray<AdminSection> = [
  { key: 'overview', label: 'Tổng quan', detail: 'KPI và việc đang chờ', icon: 'solar:chart-2-bold', to: '/admin' },
  { key: 'content', label: 'Content', detail: 'Kho bài học và publish', icon: 'solar:library-bold', to: '/admin/content' },
  { key: 'media', label: 'Media', detail: 'Upload và asset library', icon: 'solar:music-library-2-bold', to: '/admin/media' },
  { key: 'imports', label: 'Import', detail: 'Nhập content theo batch', icon: 'solar:cloud-upload-bold', to: '/admin/imports' },
  { key: 'writing', label: 'Writing review', detail: 'Chấm bài đang chờ', icon: 'solar:pen-new-square-bold', to: '/admin/writing' },
  { key: 'users', label: 'Người dùng', detail: 'Quyền và trạng thái', icon: 'solar:users-group-rounded-bold', to: '/admin/users' },
  { key: 'audit', label: 'Audit', detail: 'Dấu vết vận hành', icon: 'solar:document-text-bold', to: '/admin/audit' }
];

export const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'CONTENT_EDITOR', 'MODERATOR'] as const;

/** An admin surface is reachable when the account carries at least one operations role. */
export function hasAdminAccess(roles: readonly string[] | undefined | null): boolean {
  if (!roles?.length) return false;
  return roles.some((role) => (adminRoles as readonly string[]).includes(role));
}

export type StatusCounts = Record<string, number>;

export type AdminOverview = {
  users: StatusCounts;
  content: StatusCounts;
  media: StatusCounts;
  imports: StatusCounts;
  writing: StatusCounts;
  reports: StatusCounts;
  orders: StatusCounts;
  recentAudit: Array<{ id: string; action: string; entity: string; entityId?: string | null; createdAt: string }>;
};

export type PendingItem = { key: string; label: string; detail: string; count: number; to: string };

/**
 * Work that is waiting on an operator, newest bottleneck first. Only states the API
 * actually reported are surfaced — a missing group means zero, never an invented number.
 */
export function pendingWork(overview: AdminOverview | null): PendingItem[] {
  if (!overview) return [];
  const items: PendingItem[] = [
    { key: 'writing', label: 'Bài Writing chờ chấm', detail: 'Review thủ công và gửi feedback', count: overview.writing.GRADING ?? 0, to: '/admin/writing' },
    { key: 'content', label: 'Content còn draft', detail: 'Hoàn thiện rồi publish', count: overview.content.DRAFT ?? 0, to: '/admin/content' },
    { key: 'media', label: 'Asset chưa sẵn sàng', detail: 'Upload đang xử lý hoặc lỗi', count: (overview.media.PENDING ?? 0) + (overview.media.FAILED ?? 0), to: '/admin/media' },
    { key: 'imports', label: 'Import batch lỗi', detail: 'Sửa lỗi theo dòng rồi chạy lại', count: overview.imports.FAILED ?? 0, to: '/admin/imports' },
    { key: 'reports', label: 'Report chờ xử lý', detail: 'Moderation queue của cộng đồng', count: overview.reports.OPEN ?? 0, to: '/admin/users' }
  ];
  return items.filter((item) => item.count > 0).sort((left, right) => right.count - left.count);
}

export function sumCounts(counts: StatusCounts | undefined): number {
  if (!counts) return 0;
  return Object.values(counts).reduce((total, value) => total + value, 0);
}

export function formatBytes(value: number): string {
  return value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Chưa gửi';
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
