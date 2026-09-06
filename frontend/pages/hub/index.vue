<script setup lang="ts">
type User = {
  id: string;
  email: string;
  displayName: string;
  avatarAssetId?: string | null;
  timezone?: string;
  locale?: string;
  createdAt?: string;
  roles: string[];
  plan: string;
};

type Dashboard = {
  metrics: {
    accuracy: number;
    xp: number;
    streakDays: number;
    dueVocabulary: number;
    writing: { grading: number; graded: number };
    lastExam: { score: number | null } | null;
  };
};

type Device = {
  id: string;
  type: string;
  browser?: string | null;
  label?: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

type TabKey = 'profile' | 'password' | 'devices' | 'notifications' | 'referral';

const route = useRoute();
const router = useRouter();
const { request, accessToken, refreshToken } = useAppApi();

const tabs: Array<{ key: TabKey; label: string; icon: string; detail: string }> = [
  { key: 'profile', label: 'Thông tin cá nhân', icon: 'solar:user-circle-bold-duotone', detail: 'Tên, email và gói học' },
  { key: 'password', label: 'Đổi mật khẩu', icon: 'solar:lock-keyhole-minimalistic-bold', detail: 'Giữ tài khoản an toàn' },
  { key: 'devices', label: 'Thiết bị', icon: 'tabler:devices', detail: 'Các phiên đang hoạt động' },
  { key: 'notifications', label: 'Thông báo', icon: 'solar:bell-bing-bold', detail: 'Nhắc ôn và streak' },
  { key: 'referral', label: 'Chia sẻ & giới thiệu', icon: 'solar:share-bold', detail: 'Theo dõi lời mời' }
];

const validTabs = new Set<TabKey>(tabs.map((tab) => tab.key));
const activeTab = computed<TabKey>(() => {
  const candidate = String(route.query.tab ?? 'profile') as TabKey;
  return validTabs.has(candidate) ? candidate : 'profile';
});

const user = ref<User | null>(null);
const dashboard = ref<Dashboard | null>(null);
const devices = ref<Device[]>([]);
const notifications = ref<Notification[]>([]);
const loading = ref(true);
const busy = ref(false);
const notice = ref('');
const displayName = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const notificationPrefs = ref({ vocabulary: true, streak: true, goals: true, community: true });

const initials = computed(() => (user.value?.displayName || 'Đ').trim().slice(0, 1).toUpperCase());
const memberSince = computed(() => user.value?.createdAt ? new Date(user.value.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : 'Đang cập nhật');
const unreadCount = computed(() => notifications.value.filter((item) => !item.readAt).length);
const formatDate = (value: string) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
const deviceLabel = (device: Device) => device.label || device.browser || device.type.toLowerCase();

function goToTab(tab: TabKey) {
  void router.replace({ query: { tab } });
  notice.value = '';
}

async function loadHub() {
  if (!accessToken.value) {
    await navigateTo('/account');
    return;
  }
  loading.value = true;
  const results = await Promise.allSettled([
    request<User>('/users/me'),
    request<Dashboard>('/learning/dashboard'),
    request<Device[]>('/users/me/devices'),
    request<Notification[]>('/notifications?limit=30')
  ]);
  const [userResult, dashboardResult, deviceResult, notificationResult] = results;
  if (userResult.status === 'fulfilled') {
    user.value = userResult.value;
    displayName.value = userResult.value.displayName;
  } else {
    accessToken.value = null;
    refreshToken.value = null;
    await navigateTo('/account');
  }
  if (dashboardResult.status === 'fulfilled') dashboard.value = dashboardResult.value;
  if (deviceResult.status === 'fulfilled') devices.value = deviceResult.value;
  if (notificationResult.status === 'fulfilled') notifications.value = notificationResult.value;
  loading.value = false;
}

async function updateProfile() {
  if (!displayName.value.trim() || busy.value) return;
  busy.value = true;
  notice.value = '';
  try {
    const updated = await request<Partial<User>>('/users/me', { method: 'PATCH', body: { displayName: displayName.value.trim() } });
    user.value = user.value ? { ...user.value, ...updated } : user.value;
    displayName.value = updated.displayName ?? displayName.value.trim();
    notice.value = 'Đã lưu thông tin cá nhân.';
  } catch {
    notice.value = 'Chưa lưu được thông tin. Kiểm tra kết nối rồi thử lại.';
  } finally {
    busy.value = false;
  }
}

async function updatePassword() {
  if (busy.value) return;
  if (newPassword.value.length < 8) { notice.value = 'Mật khẩu mới cần ít nhất 8 ký tự.'; return; }
  if (newPassword.value !== confirmPassword.value) { notice.value = 'Mật khẩu xác nhận chưa khớp.'; return; }
  busy.value = true;
  notice.value = '';
  try {
    await request('/users/me/password', { method: 'PATCH', body: { currentPassword: currentPassword.value, newPassword: newPassword.value } });
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    notice.value = 'Đã đổi mật khẩu. Các phiên đăng nhập khác đã được đăng xuất.';
  } catch {
    notice.value = 'Mật khẩu hiện tại chưa đúng hoặc không thể đổi lúc này.';
  } finally {
    busy.value = false;
  }
}

async function removeDevice(device: Device) {
  if (busy.value) return;
  busy.value = true;
  try {
    await request(`/users/me/devices/${device.id}`, { method: 'DELETE' });
    devices.value = devices.value.filter((item) => item.id !== device.id);
    notice.value = 'Đã gỡ thiết bị khỏi tài khoản.';
  } catch {
    notice.value = 'Chưa gỡ được thiết bị. Hãy tải lại và thử lại.';
  } finally {
    busy.value = false;
  }
}

async function markNotificationsRead() {
  if (!unreadCount.value || busy.value) return;
  busy.value = true;
  try {
    await request('/notifications/read-all', { method: 'PATCH' });
    notifications.value = notifications.value.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }));
    notice.value = 'Đã đánh dấu tất cả thông báo là đã đọc.';
  } catch {
    notice.value = 'Chưa cập nhật được trạng thái thông báo.';
  } finally {
    busy.value = false;
  }
}

function saveNotificationPrefs() {
  if (import.meta.client) localStorage.setItem('dau-notification-prefs', JSON.stringify(notificationPrefs.value));
}

onMounted(() => {
  const saved = localStorage.getItem('dau-notification-prefs');
  if (saved) {
    try { notificationPrefs.value = { ...notificationPrefs.value, ...JSON.parse(saved) }; } catch { /* use defaults */ }
  }
  void loadHub();
});

watch(notificationPrefs, saveNotificationPrefs, { deep: true });
</script>

<template>
  <div class="hub-page page-enter space-y-6">
    <section class="hub-hero relative overflow-hidden rounded-[28px] bg-ink p-6 text-white shadow-float sm:p-9">
      <div class="relative z-10 flex flex-wrap items-end justify-between gap-7">
        <div class="flex items-center gap-4 sm:gap-5">
          <div class="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-leaf text-2xl font-extrabold text-ink shadow-soft sm:h-20 sm:w-20 sm:text-3xl">{{ initials }}</div>
          <div>
            <p class="text-xs font-bold text-leaf">KHÔNG GIAN CỦA BẠN</p>
            <h1 class="mt-2 text-3xl font-extrabold tracking-[-0.06em] sm:text-4xl">{{ user?.displayName || 'Đang tải hồ sơ…' }}</h1>
            <p class="mt-2 text-sm text-white/60">{{ user?.email || 'Đang đồng bộ tài khoản' }}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-7 gap-y-3 text-right sm:grid-cols-4">
          <div><p class="text-[11px] text-white/45">Gói hiện tại</p><p class="mt-1 font-extrabold text-bean">{{ user?.plan || '—' }}</p></div>
          <div><p class="text-[11px] text-white/45">XP</p><p class="mt-1 font-extrabold">{{ dashboard?.metrics.xp ?? '—' }}</p></div>
          <div><p class="text-[11px] text-white/45">Streak</p><p class="mt-1 font-extrabold">{{ dashboard?.metrics.streakDays ?? '—' }} ngày</p></div>
          <div><p class="text-[11px] text-white/45">Thông báo</p><p class="mt-1 font-extrabold">{{ unreadCount }}</p></div>
        </div>
      </div>
      <div class="absolute -bottom-24 -right-8 h-64 w-64 rounded-full border-[28px] border-white/10" aria-hidden="true" />
      <div class="absolute -right-4 top-8 h-16 w-16 rounded-full bg-bean/80" aria-hidden="true" />
    </section>

    <div v-if="notice" class="rounded-2xl bg-bean/20 px-4 py-3 text-xs font-bold text-[#8B6400]" role="status">{{ notice }}</div>

    <div class="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
      <nav class="hub-nav overflow-hidden rounded-[22px] border border-line bg-white p-2 shadow-soft" aria-label="Quản lý tài khoản">
        <button v-for="tab in tabs" :key="tab.key" class="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-paper focus-ring" :class="activeTab === tab.key ? 'bg-[#E7F7F1] text-ink' : 'text-ink/65'" @click="goToTab(tab.key)">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" :class="activeTab === tab.key ? 'bg-leaf text-ink' : 'bg-paper text-ink/55'"><AppIcon :icon="tab.icon" :size="21" /></span>
          <span class="min-w-0"><span class="block text-xs font-extrabold">{{ tab.label }}</span><span class="mt-0.5 block text-[11px] leading-4 text-ink/45">{{ tab.detail }}</span></span>
        </button>
        <div class="my-2 border-t border-line" />
        <NuxtLink to="/" class="flex items-center gap-2 rounded-2xl px-3 py-3 text-xs font-bold text-ink/55 hover:bg-paper focus-ring"><AppIcon icon="solar:arrow-left-linear" :size="18" /> Về dashboard học</NuxtLink>
      </nav>

      <section class="hub-panel min-w-0 rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-7">
        <div v-if="loading" class="rounded-2xl bg-paper p-6 text-sm text-ink/55">Đang mở không gian tài khoản…</div>

        <template v-else-if="activeTab === 'profile'">
          <div class="border-b border-line pb-5"><p class="text-xs font-bold text-leaf">HỒ SƠ</p><h2 class="mt-2 text-2xl font-extrabold tracking-[-0.05em]">Thông tin cá nhân</h2><p class="mt-2 max-w-xl text-sm leading-6 text-ink/55">Tên hiển thị của bạn xuất hiện trong cộng đồng, bảng xếp hạng và lịch sử học.</p></div>
          <form class="mt-6 max-w-xl space-y-5" @submit.prevent="updateProfile">
            <div><label for="hub-display-name" class="text-xs font-extrabold text-ink/55">Tên hiển thị</label><input id="hub-display-name" v-model="displayName" class="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none transition focus:border-iris" maxlength="120" autocomplete="name"></div>
            <div><p class="text-xs font-extrabold text-ink/55">Email</p><p class="mt-2 rounded-xl bg-paper px-4 py-3 text-sm text-ink/60">{{ user?.email }} <span class="ml-2 text-xs text-ink/35">Chỉ đọc</span></p></div>
            <div class="grid gap-3 sm:grid-cols-2"><div class="rounded-2xl bg-[#E7F7F1] p-4"><p class="text-[11px] font-bold text-leaf">THÀNH VIÊN TỪ</p><p class="mt-2 text-sm font-extrabold">{{ memberSince }}</p></div><div class="rounded-2xl bg-[#FFF6DF] p-4"><p class="text-[11px] font-bold text-[#A87400]">ĐIỂM GẦN NHẤT</p><p class="mt-2 text-sm font-extrabold">{{ dashboard?.metrics.lastExam?.score ?? 'Chưa có' }}</p></div></div>
            <button class="rounded-xl bg-ink px-5 py-3 text-xs font-extrabold text-white transition hover:bg-iris disabled:opacity-40 focus-ring" :disabled="busy">{{ busy ? 'Đang lưu…' : 'Lưu thay đổi' }}</button>
          </form>
        </template>

        <template v-else-if="activeTab === 'password'">
          <div class="border-b border-line pb-5"><p class="text-xs font-bold text-leaf">BẢO MẬT</p><h2 class="mt-2 text-2xl font-extrabold tracking-[-0.05em]">Đổi mật khẩu</h2><p class="mt-2 max-w-xl text-sm leading-6 text-ink/55">Sau khi đổi, các phiên đăng nhập khác sẽ bị thu hồi để bảo vệ tài khoản.</p></div>
          <form class="mt-6 max-w-xl space-y-4" @submit.prevent="updatePassword"><div><label for="current-password" class="text-xs font-extrabold text-ink/55">Mật khẩu hiện tại</label><input id="current-password" v-model="currentPassword" type="password" class="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-iris" autocomplete="current-password"></div><div><label for="new-password" class="text-xs font-extrabold text-ink/55">Mật khẩu mới</label><input id="new-password" v-model="newPassword" type="password" class="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-iris" minlength="8" autocomplete="new-password"></div><div><label for="confirm-password" class="text-xs font-extrabold text-ink/55">Nhập lại mật khẩu mới</label><input id="confirm-password" v-model="confirmPassword" type="password" class="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-iris" minlength="8" autocomplete="new-password"></div><button class="mt-2 rounded-xl bg-ink px-5 py-3 text-xs font-extrabold text-white hover:bg-iris disabled:opacity-40 focus-ring" :disabled="busy">{{ busy ? 'Đang cập nhật…' : 'Đổi mật khẩu' }}</button></form>
        </template>

        <template v-else-if="activeTab === 'devices'">
          <div class="border-b border-line pb-5"><p class="text-xs font-bold text-leaf">TRUY CẬP</p><h2 class="mt-2 text-2xl font-extrabold tracking-[-0.05em]">Thiết bị đã đăng nhập</h2><p class="mt-2 max-w-xl text-sm leading-6 text-ink/55">Bạn có thể gỡ một thiết bị không còn sử dụng. Giới hạn tham chiếu: tối đa 3 thiết bị.</p></div>
          <div v-if="devices.length" class="mt-6 divide-y divide-line"> <div v-for="device in devices" :key="device.id" class="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-2xl bg-paper text-lg text-iris">▣</span><div><p class="text-sm font-extrabold">{{ deviceLabel(device) }}</p><p class="mt-1 text-xs text-ink/45">{{ device.type }} · hoạt động {{ formatDate(device.lastSeenAt) }}</p></div></div><button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold text-ink/60 hover:border-iris hover:text-iris focus-ring" :disabled="busy" @click="removeDevice(device)">Gỡ thiết bị</button></div></div>
          <div v-else class="mt-6 rounded-2xl bg-paper p-5 text-sm text-ink/55">Chưa có thiết bị nào được ghi nhận trong phiên này.</div>
        </template>

        <template v-else-if="activeTab === 'notifications'">
          <div class="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5"><div><p class="text-xs font-bold text-leaf">NHẮC NHỞ</p><h2 class="mt-2 text-2xl font-extrabold tracking-[-0.05em]">Thông báo</h2><p class="mt-2 max-w-xl text-sm leading-6 text-ink/55">Chọn nhịp nhắc giúp bạn quay lại học mà không bị làm phiền.</p></div><button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-paper disabled:opacity-40 focus-ring" :disabled="!unreadCount || busy" @click="markNotificationsRead">Đã đọc tất cả</button></div>
          <div class="mt-6 grid gap-3 sm:grid-cols-2"><label v-for="item in [{ key: 'vocabulary', label: 'Ôn từ vựng', detail: 'Nhắc khi thẻ SRS đến hạn' }, { key: 'streak', label: 'Giữ streak', detail: 'Nhắc khi hôm nay chưa học' }, { key: 'goals', label: 'Mục tiêu ngày', detail: 'Tóm tắt tiến độ trong ngày' }, { key: 'community', label: 'Cộng đồng', detail: 'Phản hồi và hoạt động liên quan' }]" :key="item.key" class="flex cursor-pointer items-start gap-3 rounded-2xl bg-paper p-4"><input v-model="notificationPrefs[item.key as keyof typeof notificationPrefs]" type="checkbox" class="mt-1 h-4 w-4 accent-iris"><span><span class="block text-sm font-extrabold">{{ item.label }}</span><span class="mt-1 block text-xs leading-5 text-ink/50">{{ item.detail }}</span></span></label></div>
          <div class="mt-8"><div class="flex items-center justify-between gap-3"><h3 class="text-sm font-extrabold">Gần đây</h3><span class="text-xs text-ink/40">{{ unreadCount }} chưa đọc</span></div><div v-if="notifications.length" class="mt-3 divide-y divide-line"> <div v-for="item in notifications" :key="item.id" class="py-3"><p class="text-sm font-extrabold" :class="item.readAt ? 'text-ink/60' : 'text-ink'">{{ item.title }}</p><p class="mt-1 text-xs leading-5 text-ink/50">{{ item.body }}</p><p class="mt-1 text-[11px] text-ink/35">{{ formatDate(item.createdAt) }}</p></div></div><p v-else class="mt-3 rounded-2xl bg-paper p-5 text-xs leading-5 text-ink/55">Chưa có thông báo mới. Khi có hoạt động đáng chú ý, chúng sẽ xuất hiện ở đây.</p></div>
        </template>

        <template v-else>
          <div class="border-b border-line pb-5"><p class="text-xs font-bold text-leaf">CHIA SẺ</p><h2 class="mt-2 text-2xl font-extrabold tracking-[-0.05em]">Giới thiệu bạn bè</h2><p class="mt-2 max-w-xl text-sm leading-6 text-ink/55">Khu vực theo dõi lượt giới thiệu và hoa hồng của bạn.</p></div>
          <div class="mt-6 rounded-[22px] bg-[#E7F7F1] p-5 sm:p-6"><p class="text-xs font-bold text-leaf">REFERRAL HUB</p><h3 class="mt-2 text-xl font-extrabold">Chia sẻ hành trình học của bạn</h3><p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Mã giới thiệu, attribution và lịch sử hoa hồng sẽ được nối với billing khi hệ thống thanh toán production được bật.</p><NuxtLink to="/upgrade" class="mt-5 inline-flex rounded-xl bg-ink px-4 py-3 text-xs font-extrabold text-white hover:bg-iris focus-ring">Xem các gói học</NuxtLink></div>
          <div class="mt-5 grid gap-3 sm:grid-cols-3"><div v-for="item in [{ label: 'Lượt truy cập', value: '—' }, { label: 'Bạn đã mời', value: '—' }, { label: 'Hoa hồng', value: '—' }]" :key="item.label" class="rounded-2xl border border-line p-4"><p class="text-xs text-ink/45">{{ item.label }}</p><p class="mt-2 text-2xl font-extrabold">{{ item.value }}</p><p class="mt-1 text-[11px] text-ink/40">Chưa có dữ liệu</p></div></div>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.hub-page {
  --hub-cream: #fffdf7;
  --hub-mint: #eaf8ef;
  --hub-green: #58cc02;
  --hub-blue: #1cb0f6;
  --hub-yellow: #ffc800;
  --hub-ink: #263238;
  width: 100vw;
  margin: -1.5rem calc(50% - 50vw) -4rem;
  min-height: calc(100vh - 68px);
  padding: 1.5rem max(1rem, calc((100vw - 1320px) / 2 + 1rem)) 4rem;
  background: var(--hub-cream);
  color: var(--hub-ink);
}

.hub-page :is(.shadow-soft, .shadow-float) { box-shadow: none !important; }
.hub-page :is(.border-line) { border-color: #dcecdf !important; }
.hub-page :is(.bg-white) { background-color: transparent !important; }
.hub-page :is(.bg-paper) { background-color: var(--hub-mint) !important; }
.hub-page :is(input, textarea) { border-color: #bfe3c7 !important; background: #fff !important; }
.hub-page :is(input, textarea):focus,
.hub-page :is(input, textarea):focus-visible {
  border-width: 1px !important;
  border-color: #8bd85e !important;
  outline: 2px solid rgba(88, 204, 2, .22) !important;
  outline-offset: 1px !important;
  box-shadow: none !important;
}
.hub-page :is(.text-ink\/45, .text-ink\/50, .text-ink\/55, .text-ink\/60, .text-ink\/65) { color: rgba(38, 50, 56, .68) !important; }

.hub-hero {
  border-bottom: 5px solid var(--hub-green);
  border-radius: 22px !important;
  background: #e9f8e6 !important;
  color: var(--hub-ink) !important;
}

.hub-hero .text-white { color: var(--hub-ink) !important; }
.hub-hero :is(.text-white\/45, .text-white\/60) { color: rgba(38, 50, 56, .62) !important; }
.hub-hero .text-leaf { color: #46a900 !important; }
.hub-hero .border-white\/10 { border-color: rgba(38, 50, 56, .1) !important; }

.hub-hero::after {
  position: absolute;
  right: 2.5rem;
  bottom: 0;
  left: 2.5rem;
  height: 5px;
  border-radius: 999px 999px 0 0;
  background: linear-gradient(90deg, var(--hub-green) 0 42%, var(--hub-yellow) 42% 58%, rgba(255,255,255,.16) 58%);
  content: '';
}

.hub-nav {
  border: 0 !important;
  background: transparent !important;
  padding: 0 !important;
}

.hub-nav button {
  border-radius: 14px;
  min-height: 3.9rem;
}

.hub-nav button:hover { background: #f1faee !important; }
.hub-nav button[class*="bg-[#E7F7F1]"] { background: var(--hub-mint) !important; }
.hub-nav button[class*="bg-[#E7F7F1]"] span:first-child { background: var(--hub-green) !important; }

.hub-panel {
  border: 0 !important;
  background: transparent !important;
  padding: 0 !important;
}

.hub-panel > :is(template, div) { max-width: 55rem; }
.hub-panel :is(.bg-\[\#E7F7F1\]) { background: var(--hub-mint) !important; }
.hub-panel :is(.bg-\[\#FFF6DF\]) { background: #fff7d6 !important; }
.hub-panel button[class*="bg-ink"], .hub-panel a[class*="bg-ink"] {
  border-radius: 16px;
  corner-shape: squircle;
}
.hub-panel button[class*="bg-ink"] { background: var(--hub-green) !important; color: #fff !important; box-shadow: 0 3px 0 #46a900; }
.hub-panel button[class*="bg-ink"]:hover { background: #78db28 !important; }
.hub-panel a[class*="bg-ink"] { background: var(--hub-blue) !important; color: white !important; box-shadow: 0 3px 0 #1288c8; }
.hub-panel a[class*="bg-ink"]:hover { background: #42baf2 !important; }

@media (min-width: 640px) {
  .hub-page { padding-inline: max(1.5rem, calc((100vw - 1320px) / 2 + 1.5rem)); }
}

@media (min-width: 1024px) {
  .hub-page { padding-inline: max(2rem, calc((100vw - 1320px) / 2 + 2rem)); }
}

@media (max-width: 639px) {
  .hub-hero { border-radius: 18px !important; padding: 1.25rem !important; }
  .hub-hero .grid { text-align: left; }
  .hub-hero::after { right: 1.25rem; left: 1.25rem; }
  .hub-nav { display: flex; gap: .5rem; overflow-x: auto; padding-bottom: .25rem !important; scrollbar-width: none; }
  .hub-nav::-webkit-scrollbar { display: none; }
  .hub-nav button { min-width: 10.5rem; border-left: 0; border-bottom: 4px solid transparent; }
  .hub-nav button[class*="bg-[#E7F7F1]"] { border-bottom-color: var(--hub-green); }
  .hub-nav button > span:last-child span:last-child { white-space: nowrap; }
}
</style>
