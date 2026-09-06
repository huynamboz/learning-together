<script setup lang="ts">
import { adminSections } from '~/utils/admin';

const route = useRoute();
const { profile, signedIn, canAccess, profileLoaded, pendingReviews, ensureConsole } = useAdminConsole();

const activeSection = computed(() => {
  const matches = adminSections.filter((section) => route.path === section.to || route.path.startsWith(`${section.to}/`));
  return matches.sort((left, right) => right.to.length - left.to.length)[0] ?? adminSections[0];
});
const initial = computed(() => (profile.value?.displayName || 'Đ').trim().slice(0, 1).toUpperCase());

onMounted(ensureConsole);
</script>

<template>
  <div class="admin-console min-h-screen bg-paper text-ink">
    <div class="admin-shell mx-auto w-full max-w-[1440px] gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <aside class="admin-rail sticky top-5 hidden h-[calc(100vh-2.5rem)] flex-col rounded-[24px] bg-ink p-4 text-white lg:flex">
        <NuxtLink to="/admin" class="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/10 focus-ring">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-iris text-lg font-black">Đ</span>
          <span class="min-w-0"><span class="block text-sm font-black">Đậu TOEIC</span><span class="mt-0.5 block text-[11px] text-white/50">Admin console</span></span>
        </NuxtLink>

        <nav class="mt-6 flex-1 space-y-1 overflow-y-auto" aria-label="Khu vực quản trị">
          <NuxtLink
            v-for="section in adminSections"
            :key="section.key"
            :to="section.to"
            :aria-current="activeSection.key === section.key ? 'page' : undefined"
            :class="['flex items-center gap-3 rounded-2xl px-3 py-3 transition focus-ring', activeSection.key === section.key ? 'bg-iris text-white' : 'text-white/65 hover:bg-white/10 hover:text-white']"
          >
            <AppIcon :icon="section.icon" :size="20" />
            <span class="min-w-0"><span class="block text-xs font-extrabold">{{ section.label }}</span><span class="mt-0.5 block truncate text-[10px] opacity-65">{{ section.detail }}</span></span>
            <span v-if="section.key === 'writing' && pendingReviews" class="ml-auto rounded-lg bg-bean px-1.5 py-0.5 text-[10px] font-black text-ink">{{ pendingReviews }}</span>
          </NuxtLink>
        </nav>

        <NuxtLink to="/" class="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-white/55 transition hover:bg-white/10 hover:text-white focus-ring">
          <AppIcon icon="solar:arrow-left-linear" :size="16" /> Về dashboard học
        </NuxtLink>
      </aside>

      <div class="min-w-0">
        <header class="flex items-center justify-between gap-4 border-b border-line pb-4">
          <div class="min-w-0">
            <p class="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink/40">Admin console</p>
            <p class="mt-1 truncate text-sm font-extrabold">{{ activeSection.label }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <span v-if="profile" class="hidden max-w-[220px] truncate rounded-full bg-mint px-3 py-2 text-[11px] font-extrabold text-ink/60 sm:inline-flex">{{ profile.email }}</span>
            <NuxtLink to="/hub?tab=profile" class="grid h-9 w-9 place-items-center rounded-full bg-iris text-xs font-black text-white focus-ring" aria-label="Mở hồ sơ">{{ initial }}</NuxtLink>
          </div>
        </header>

        <nav class="admin-mobile-nav mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Khu vực quản trị">
          <NuxtLink
            v-for="section in adminSections"
            :key="section.key"
            :to="section.to"
            :class="['flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold transition focus-ring', activeSection.key === section.key ? 'bg-iris text-white shadow-press-sky' : 'bg-mint text-ink/55 hover:bg-line/50']"
          >
            <AppIcon :icon="section.icon" :size="16" />{{ section.label }}
          </NuxtLink>
        </nav>

        <main class="page-enter mt-6">
          <div v-if="!profileLoaded" class="rounded-[22px] border border-line p-8 text-sm text-ink/55">Đang kiểm tra quyền truy cập…</div>

          <div v-else-if="!signedIn" class="rounded-[22px] border border-line p-8">
            <p class="text-xs font-extrabold text-iris">CẦN ĐĂNG NHẬP</p>
            <h1 class="mt-2 text-2xl font-extrabold tracking-[-0.05em]">Admin console yêu cầu tài khoản vận hành</h1>
            <p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Đăng nhập bằng tài khoản có quyền admin, content editor hoặc moderator để mở khu vực này.</p>
            <NuxtLink to="/account" class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Đăng nhập</NuxtLink>
          </div>

          <div v-else-if="!canAccess" class="rounded-[22px] border border-line p-8">
            <p class="text-xs font-extrabold text-[#B5473A]">KHÔNG ĐỦ QUYỀN</p>
            <h1 class="mt-2 text-2xl font-extrabold tracking-[-0.05em]">Tài khoản này không có quyền vận hành</h1>
            <p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Bạn đang đăng nhập bằng <span class="font-bold">{{ profile?.email }}</span>. Cần vai trò ADMIN, SUPER_ADMIN, CONTENT_EDITOR hoặc MODERATOR để xem dữ liệu vận hành.</p>
            <NuxtLink to="/" class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Về dashboard học</NuxtLink>
          </div>

          <slot v-else />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-shell { display: grid; grid-template-columns: minmax(0, 1fr); }
.admin-mobile-nav { scrollbar-width: none; }
.admin-mobile-nav::-webkit-scrollbar { display: none; }

@media (min-width: 1024px) {
  .admin-shell { grid-template-columns: 252px minmax(0, 1fr); align-items: start; }
}
</style>
