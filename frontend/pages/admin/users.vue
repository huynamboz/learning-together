<script setup lang="ts">
import { formatDateTime } from '~/utils/admin';

definePageMeta({ layout: 'admin' });

type AdminUser = { id: string; email: string; displayName: string; status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'; createdAt: string; roles: string[]; plan: string };

const { request } = useAppApi();
const { canAccess, loadOverview, ensureConsole } = useAdminConsole();
const toast = useToast();
const { confirm } = useConfirm();

const users = ref<AdminUser[]>([]);
const loading = ref(false);
const search = ref('');
const updatingId = ref('');

const activeCount = computed(() => users.value.filter((user) => user.status === 'ACTIVE').length);
const suspendedCount = computed(() => users.value.filter((user) => user.status === 'SUSPENDED').length);

async function loadUsers() {
  if (!canAccess.value) return;
  loading.value = true;
  try { users.value = await request<AdminUser[]>('/admin/users', { query: { search: search.value, limit: 100 } }); }
  catch { toast.error('Không tải được danh sách người dùng', 'Cần quyền admin hoặc moderator.'); }
  finally { loading.value = false; }
}

async function applyStatus(user: AdminUser, status: AdminUser['status']) {
  updatingId.value = user.id;
  try {
    const updated = await request<Pick<AdminUser, 'id' | 'status'>>(`/admin/users/${user.id}/status`, { method: 'PATCH', body: { status } });
    users.value = users.value.map((item) => item.id === updated.id ? { ...item, status: updated.status } : item);
    if (status === 'SUSPENDED') toast.success('Đã tạm khóa tài khoản', `${user.displayName} không đăng nhập được nữa. Sự kiện đã vào audit log.`);
    else toast.success('Đã kích hoạt lại tài khoản', `${user.displayName} có thể đăng nhập trở lại.`);
    await loadOverview();
  } catch { toast.error('Không cập nhật được trạng thái', 'Kiểm tra quyền hoặc thử lại.'); }
  finally { updatingId.value = ''; }
}

function updateStatus(user: AdminUser, status: AdminUser['status']) {
  // Suspending cuts a learner off mid-course, so it asks first and keeps the dialog
  // busy until the API answers — the action cannot be fired twice.
  if (status !== 'SUSPENDED') return applyStatus(user, status);
  return confirm({
    title: `Tạm khóa ${user.displayName}?`,
    description: `${user.email} sẽ không đăng nhập được cho tới khi bạn kích hoạt lại. Thao tác này được ghi vào audit log kèm tên bạn.`,
    confirmLabel: 'Tạm khóa tài khoản',
    cancelLabel: 'Giữ nguyên',
    tone: 'danger'
  }, () => applyStatus(user, status));
}

onMounted(async () => { await ensureConsole(); await loadUsers(); });
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      eyebrow="Quyền và trạng thái"
      title="Người dùng"
      description="Theo dõi vai trò, gói học và trạng thái tài khoản. Mọi thay đổi trạng thái đều ghi audit kèm người thực hiện."
    >
      <template #aside>
        <div class="flex gap-2">
          <span class="rounded-2xl bg-mint px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Active</span><span class="mt-0.5 block text-lg font-black text-[#46A900]">{{ activeCount }}</span></span>
          <span class="rounded-2xl bg-blush px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Đang khóa</span><span class="mt-0.5 block text-lg font-black text-[#B5473A]">{{ suspendedCount }}</span></span>
        </div>
      </template>
    </AdminPageHeader>

    <section class="rounded-[22px] border border-line p-5 sm:p-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div><p class="text-xs font-extrabold text-ink/45">ACCESS REVIEW</p><h2 class="mt-1 text-xl font-extrabold">{{ users.length }} tài khoản</h2></div>
        <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadUsers">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
      </div>

      <div class="mt-5 flex flex-wrap items-start gap-2">
        <AppInput v-model="search" class="min-w-[180px] flex-1" placeholder="Tìm tên hoặc email…" aria-label="Tìm người dùng" @keyup.enter="loadUsers" />
        <button class="cta-grass px-4 py-3 text-sm font-extrabold focus-ring" @click="loadUsers">Tìm</button>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-xs">
          <thead class="text-ink/40"><tr><th class="pb-3 pr-4 font-bold">Người dùng</th><th class="pb-3 pr-4 font-bold">Vai trò</th><th class="pb-3 pr-4 font-bold">Gói</th><th class="pb-3 pr-4 font-bold">Tham gia</th><th class="pb-3 pr-4 font-bold">Trạng thái</th><th class="pb-3 font-bold">Thao tác</th></tr></thead>
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-t border-line">
              <td class="py-3 pr-4"><p class="font-extrabold">{{ user.displayName }}</p><p class="mt-1 text-ink/40">{{ user.email }}</p></td>
              <td class="py-3 pr-4"><span class="rounded-lg bg-iris/10 px-2 py-1 text-[10px] font-extrabold text-iris">{{ user.roles.join(' · ') || 'LEARNER' }}</span></td>
              <td class="py-3 pr-4 font-bold">{{ user.plan }}</td>
              <td class="py-3 pr-4 text-ink/45">{{ formatDateTime(user.createdAt) }}</td>
              <td class="py-3 pr-4"><span :class="['rounded-lg px-2 py-1 text-[10px] font-extrabold', user.status === 'ACTIVE' ? 'bg-leaf/15 text-[#28896D]' : 'bg-blush text-[#B5473A]']">{{ user.status }}</span></td>
              <td class="py-3">
                <button v-if="user.status === 'ACTIVE'" class="rounded-lg px-2 py-1 font-bold text-[#B5473A] hover:bg-blush disabled:opacity-40 focus-ring" :disabled="updatingId === user.id" @click="updateStatus(user, 'SUSPENDED')">{{ updatingId === user.id ? 'Đang lưu…' : 'Tạm khóa' }}</button>
                <button v-else class="rounded-lg px-2 py-1 font-bold text-iris hover:bg-iris/10 disabled:opacity-40 focus-ring" :disabled="updatingId === user.id" @click="updateStatus(user, 'ACTIVE')">{{ updatingId === user.id ? 'Đang lưu…' : 'Kích hoạt' }}</button>
              </td>
            </tr>
            <tr v-if="loading && !users.length"><td colspan="6" class="py-8 text-center text-ink/45">Đang tải danh sách…</td></tr>
            <tr v-else-if="!users.length"><td colspan="6" class="py-8 text-center text-ink/45">Không có tài khoản nào khớp từ khóa này.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
