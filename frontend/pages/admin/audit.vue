<script setup lang="ts">
import { formatDateTime } from '~/utils/admin';

definePageMeta({ layout: 'admin' });

type AuditEntry = { id: string; action: string; entity: string; entityId?: string | null; requestId?: string | null; createdAt: string; actor?: { email: string; displayName: string } | null };

const { request } = useAppApi();
const { canAccess, ensureConsole } = useAdminConsole();
const toast = useToast();

const entries = ref<AuditEntry[]>([]);
const loading = ref(false);
const entityFilter = ref('ALL');

const entities = computed(() => ['ALL', ...Array.from(new Set(entries.value.map((entry) => entry.entity))).sort()]);
const filtered = computed(() => entityFilter.value === 'ALL' ? entries.value : entries.value.filter((entry) => entry.entity === entityFilter.value));

async function loadAudit() {
  if (!canAccess.value) return;
  loading.value = true;
  try { entries.value = await request<AuditEntry[]>('/admin/audit', { query: { limit: 100 } }); }
  catch { toast.error('Không tải được audit log', 'Cần quyền admin hoặc moderator.'); }
  finally { loading.value = false; }
}

onMounted(async () => { await ensureConsole(); await loadAudit(); });
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      eyebrow="Dấu vết vận hành"
      title="Audit"
      description="Mỗi thao tác nhạy cảm — publish, đổi visibility, chấm bài, đổi trạng thái tài khoản — đều để lại một bản ghi không sửa được."
    >
      <template #aside>
        <span class="rounded-2xl bg-mint px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Sự kiện</span><span class="mt-0.5 block text-lg font-black">{{ filtered.length }}</span></span>
      </template>
    </AdminPageHeader>

    <section class="rounded-[22px] border border-line p-5 sm:p-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><p class="text-xs font-extrabold text-ink/45">AUDIT TRAIL</p><h2 class="mt-1 text-xl font-extrabold">Sự kiện gần đây</h2></div>
        <div class="flex items-center gap-2">
          <AppSelect v-model="entityFilter" class="w-full sm:w-auto" aria-label="Lọc theo entity">
            <option v-for="entity in entities" :key="entity" :value="entity">{{ entity === 'ALL' ? 'Mọi entity' : entity }}</option>
          </AppSelect>
          <button class="shrink-0 rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadAudit">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>
      </div>

      <ol class="mt-5 divide-y divide-line">
        <li v-for="entry in filtered" :key="entry.id" class="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
          <div class="min-w-0">
            <p class="font-extrabold">{{ entry.action }} <span class="font-normal text-ink/45">· {{ entry.entity }}</span></p>
            <p class="mt-1 text-ink/45">{{ entry.actor?.displayName || entry.actor?.email || 'System' }} · {{ formatDateTime(entry.createdAt) }}</p>
          </div>
          <span class="shrink-0 rounded-lg bg-mint px-2 py-1 font-bold text-ink/55">{{ entry.entityId ? entry.entityId.slice(0, 8) : 'SYSTEM' }}</span>
        </li>
        <li v-if="loading && !entries.length" class="py-8 text-center text-xs text-ink/45">Đang tải audit log…</li>
        <li v-else-if="!entries.length" class="py-8 text-center text-xs text-ink/45">Chưa có sự kiện audit nào được ghi nhận.</li>
        <li v-else-if="!filtered.length" class="py-8 text-center text-xs text-ink/45">Không có sự kiện nào cho entity đã chọn.</li>
      </ol>
    </section>
  </div>
</template>
