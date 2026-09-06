<script setup lang="ts">
import { formatDateTime, pendingWork, sumCounts } from '~/utils/admin';

definePageMeta({ layout: 'admin' });

const { request } = useAppApi();
const { overview, overviewLoading, canAccess, loadOverview, ensureConsole } = useAdminConsole();

type Health = { status: string; service: string; timestamp: string };
const health = ref<Health | null>(null);
const healthChecked = ref(false);

const kpis = computed(() => {
  const data = overview.value;
  return [
    { key: 'users', label: 'Tài khoản', value: sumCounts(data?.users), detail: `${data?.users.ACTIVE ?? 0} đang hoạt động`, icon: 'solar:users-group-rounded-bold', tone: 'iris' as const },
    { key: 'content', label: 'Content đã publish', value: data?.content.PUBLISHED ?? 0, detail: `${data?.content.DRAFT ?? 0} bản draft`, icon: 'solar:library-bold', tone: 'leaf' as const },
    { key: 'media', label: 'Asset sẵn sàng', value: data?.media.READY ?? 0, detail: `${sumCounts(data?.media)} asset trong kho`, icon: 'solar:music-library-2-bold', tone: 'bean' as const },
    { key: 'writing', label: 'Writing chờ chấm', value: data?.writing.GRADING ?? 0, detail: `${data?.writing.GRADED ?? 0} bài đã có feedback`, icon: 'solar:pen-new-square-bold', tone: 'plain' as const }
  ];
});

const pending = computed(() => pendingWork(overview.value));
const recentAudit = computed(() => overview.value?.recentAudit.slice(0, 6) ?? []);

async function checkHealth() {
  try { health.value = await request<Health>('/health'); }
  catch { health.value = null; }
  finally { healthChecked.value = true; }
}

async function refresh() {
  await Promise.all([loadOverview(), checkHealth()]);
}

onMounted(async () => {
  await ensureConsole();
  if (canAccess.value) await checkHealth();
});
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      eyebrow="Sức khỏe vận hành"
      title="Tổng quan"
      description="Số liệu lấy trực tiếp từ API vận hành. Ô nào chưa có dữ liệu sẽ hiển thị 0 thay vì một con số ước lượng."
    >
      <template #aside>
        <button class="rounded-xl border border-line px-3 py-2.5 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="overviewLoading" @click="refresh">
          {{ overviewLoading ? 'Đang tải…' : 'Làm mới' }}
        </button>
      </template>
    </AdminPageHeader>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricTile v-for="kpi in kpis" :key="kpi.key" :eyebrow="kpi.label" :icon="kpi.icon" :tone="kpi.tone" :value="String(kpi.value)" :caption="kpi.detail" />
    </div>

    <div class="grid gap-5 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
      <section class="rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex items-end justify-between gap-3">
          <div><p class="text-xs font-extrabold text-ink/45">VIỆC ĐANG CHỜ</p><h2 class="mt-1 text-xl font-extrabold">Cần bạn xử lý</h2></div>
          <span class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/50">{{ pending.length }} nhóm</span>
        </div>

        <ol v-if="pending.length" class="mt-5 space-y-2">
          <li v-for="item in pending" :key="item.key">
            <NuxtLink :to="item.to" class="flex items-center gap-4 rounded-2xl bg-mint p-4 transition hover:bg-line/60 focus-ring">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-lg font-black text-ink">{{ item.count }}</span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-extrabold">{{ item.label }}</span>
                <span class="mt-0.5 block text-xs text-ink/55">{{ item.detail }}</span>
              </span>
              <AppIcon icon="solar:arrow-right-linear" :size="18" />
            </NuxtLink>
          </li>
        </ol>
        <p v-else-if="overviewLoading" class="mt-5 rounded-2xl bg-mint p-5 text-xs text-ink/55">Đang tính khối lượng công việc…</p>
        <p v-else class="mt-5 rounded-2xl bg-mint p-5 text-xs leading-5 text-ink/55">Không có hàng chờ nào. Khi có bài Writing, content draft hoặc asset lỗi, chúng sẽ xuất hiện ở đây.</p>
      </section>

      <section class="rounded-[22px] border border-line p-5 sm:p-6">
        <p class="text-xs font-extrabold text-ink/45">HỆ THỐNG</p>
        <h2 class="mt-1 text-xl font-extrabold">Trạng thái dịch vụ</h2>

        <div class="mt-5 space-y-3">
          <div class="rounded-2xl bg-mint p-4">
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs font-extrabold">API</span>
              <span v-if="!healthChecked" class="text-[11px] font-bold text-ink/45">Đang kiểm tra…</span>
              <span v-else-if="health" class="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[11px] font-extrabold text-[#46A900]"><AppIcon icon="solar:record-circle-bold" :size="13" />{{ health.status }}</span>
              <span v-else class="rounded-lg bg-blush px-2 py-1 text-[11px] font-extrabold text-[#B5473A]">Không phản hồi</span>
            </div>
            <p class="mt-2 text-[11px] text-ink/50">{{ health ? `${health.service} · ${formatDateTime(health.timestamp)}` : 'Không đọc được /api/v1/health từ trình duyệt này.' }}</p>
          </div>

          <div class="rounded-2xl bg-mint p-4">
            <p class="text-xs font-extrabold">Đơn hàng</p>
            <p class="mt-2 text-[11px] leading-5 text-ink/55">{{ sumCounts(overview?.orders) }} bản ghi · {{ overview?.orders.PENDING ?? 0 }} đang chờ thanh toán</p>
          </div>

          <div class="rounded-2xl bg-mint p-4">
            <p class="text-xs font-extrabold">Import batch</p>
            <p class="mt-2 text-[11px] leading-5 text-ink/55">{{ sumCounts(overview?.imports) }} batch đã chạy · {{ overview?.imports.FAILED ?? 0 }} batch lỗi</p>
          </div>
        </div>

        <p class="mt-4 text-[11px] leading-5 text-ink/45">Storage provider được chọn phía server (local, S3 hoặc R2); console không đọc credential nên không báo trạng thái provider ở đây.</p>
      </section>
    </div>

    <section class="rounded-[22px] border border-line p-5 sm:p-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><p class="text-xs font-extrabold text-ink/45">AUDIT</p><h2 class="mt-1 text-xl font-extrabold">Sự kiện gần đây</h2></div>
        <NuxtLink to="/admin/audit" class="text-xs font-bold text-iris hover:underline focus-ring">Xem toàn bộ audit</NuxtLink>
      </div>
      <ol v-if="recentAudit.length" class="mt-4 divide-y divide-line">
        <li v-for="entry in recentAudit" :key="entry.id" class="flex flex-wrap items-center justify-between gap-2 py-3 text-xs">
          <div><p class="font-extrabold">{{ entry.action }} <span class="font-normal text-ink/45">· {{ entry.entity }}</span></p><p class="mt-1 text-ink/45">{{ formatDateTime(entry.createdAt) }}</p></div>
          <span class="rounded-lg bg-mint px-2 py-1 font-bold text-ink/55">{{ entry.entityId ? entry.entityId.slice(0, 8) : 'SYSTEM' }}</span>
        </li>
      </ol>
      <p v-else class="mt-4 rounded-2xl bg-mint p-5 text-xs text-ink/55">Chưa có sự kiện audit nào được ghi nhận.</p>
    </section>
  </div>
</template>
