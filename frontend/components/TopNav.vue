<script setup lang="ts">
defineEmits<{ toggleChat: [] }>();

const route = useRoute();
const notificationOpen = ref(false);

/** One hue per study area, so the nav reads by colour before it reads by word. */
const navItems = [
  { label: 'Nghe', icon: 'solar:headphones-round-sound-bold', to: '/listen', color: '#2BB6A3' },
  { label: 'Đọc', icon: 'solar:book-2-bold', to: '/read', color: '#1CB0F6' },
  { label: 'Viết', icon: 'solar:pen-new-square-bold', to: '/write', color: '#58CC02' },
  { label: 'Từ vựng', icon: 'solar:book-bookmark-bold', to: '/vocabulary', color: '#EFA400' },
  { label: 'Đề thi', icon: 'solar:clipboard-list-bold', to: '/mock-test', color: '#EF6C57' },
  { label: 'Video', icon: 'solar:play-circle-bold', to: '/video', color: '#8A63D2' },
  { label: 'Cộng đồng', icon: 'tabler:messages', to: '/hoi-dap', color: '#E5599A' },
  { label: 'Leaderboard', icon: 'solar:cup-star-bold', to: '/leaderboard', color: '#C08A12' }
];

/** A lesson route such as /listen/part-1-office-scene keeps its catalog tab lit. */
function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-line bg-white">
    <div class="mx-auto flex h-[68px] max-w-[1320px] items-center gap-3 px-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="mr-2 flex shrink-0 items-center rounded-xl px-1 py-1 focus-ring" aria-label="Ms Chole TOEIC — về trang chủ">
        <AppLogo :size="36" :variant="'lockup'" class="logo-in-nav" />
      </NuxtLink>

      <nav class="hidden min-w-0 flex-1 items-center gap-0.5 xl:flex" aria-label="Khu vực học">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="['nav-item focus-ring', isActive(item.to) ? 'is-active' : '']"
          :style="{ '--nav-color': item.color }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <span class="nav-icon"><AppIcon :icon="item.icon" :size="17" /></span>{{ item.label }}
        </NuxtLink>
      </nav>

      <div class="ml-auto flex items-center gap-1.5">
        <NuxtLink to="/upgrade" class="hidden rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-iris focus-ring sm:block">Nâng cấp</NuxtLink>
        <span class="hidden rounded-xl bg-white px-2.5 py-2 text-xs font-bold text-ink/70 sm:block">◷ 13m</span>
        <span class="hidden rounded-xl bg-sun px-2.5 py-2 text-xs font-bold text-[#9A6A00] sm:block">♨ 1</span>
        <div class="relative">
          <button class="grid h-10 w-10 place-items-center rounded-xl text-ink/65 transition hover:bg-white focus-ring" aria-label="Thông báo" :aria-expanded="notificationOpen" @click="notificationOpen = !notificationOpen"><AppIcon icon="solar:bell-bing-bold" :size="20" /><span class="sr-only">Thông báo</span></button>
          <div v-if="notificationOpen" class="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-line bg-white p-4 shadow-float" role="status">
            <p class="text-xs font-bold text-ink/45">THÔNG BÁO</p>
            <p class="mt-2 text-sm font-bold">Bạn đã cập nhật đến đây.</p>
            <p class="mt-1 text-xs leading-5 text-ink/50">Khi có hoạt động mới, thông báo sẽ xuất hiện trong hộp này.</p>
            <NuxtLink to="/hub?tab=notifications" class="mt-3 inline-flex text-xs font-bold text-iris hover:underline focus-ring" @click="notificationOpen = false">Mở thông báo →</NuxtLink>
          </div>
        </div>
        <NuxtLink to="/hub?tab=profile" class="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-iris font-bold text-white shadow-soft focus-ring" aria-label="Mở hồ sơ">N</NuxtLink>
      </div>
    </div>

    <div class="nav-strip flex gap-1 overflow-x-auto border-t border-line/50 px-4 py-2 xl:hidden">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="['nav-item is-compact focus-ring', isActive(item.to) ? 'is-active' : '']"
        :style="{ '--nav-color': item.color }"
        :aria-current="isActive(item.to) ? 'page' : undefined"
      >
        <span class="nav-icon"><AppIcon :icon="item.icon" :size="16" /></span>{{ item.label }}
      </NuxtLink>
    </div>
  </header>
</template>

<style scoped>
.nav-item {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: .4rem;
  border-radius: 12px;
  padding: .5rem .65rem;
  font-size: .75rem;
  font-weight: 600;
  color: rgba(38, 50, 56, .66);
  transition: background-color .16s ease, color .16s ease;
}

.nav-item.is-compact { padding: .4rem .7rem; }

.nav-icon {
  display: inline-flex;
  color: var(--nav-color);
  transition: scale .16s ease;
}

.nav-item:hover {
  background: color-mix(in srgb, var(--nav-color) 12%, transparent);
  color: var(--ink);
}
.nav-item:hover .nav-icon { scale: 1.1; }

/* Active reads three ways at once: tinted ground, coloured label, and a marker underneath. */
.nav-item.is-active {
  background: color-mix(in srgb, var(--nav-color) 15%, transparent);
  color: color-mix(in srgb, var(--nav-color) 78%, var(--ink));
  font-weight: 800;
}

.nav-item.is-active::after {
  position: absolute;
  right: .65rem;
  bottom: .18rem;
  left: .65rem;
  height: 2px;
  border-radius: 999px;
  background: var(--nav-color);
  content: '';
}

.nav-item.is-compact.is-active::after { right: .7rem; left: .7rem; bottom: .12rem; }

/* The wordmark folds away on narrow screens; the mark alone still identifies the app. */
@media (max-width: 639px) {
  .logo-in-nav :deep(.logo-words) { display: none; }
}

.nav-strip { scrollbar-width: none; }
.nav-strip::-webkit-scrollbar { display: none; }

@media (prefers-reduced-motion: reduce) {
  .nav-item, .nav-icon { transition: none; }
  .nav-item:hover .nav-icon { scale: 1; }
}
</style>
