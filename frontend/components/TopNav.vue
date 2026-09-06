<script setup lang="ts">
defineEmits<{ toggleChat: [] }>();
const notificationOpen = ref(false);
const navItems = [
  { label: 'Nghe', icon: 'solar:headphones-round-sound-bold', to: '/listen' },
  { label: 'Đọc', icon: 'solar:book-2-bold', to: '/read' },
  { label: 'Viết', icon: 'solar:pen-new-square-bold', to: '/write' },
  { label: 'Từ vựng', icon: 'solar:book-bookmark-bold', to: '/vocabulary' },
  { label: 'Đề thi', icon: 'solar:clipboard-list-bold', to: '/mock-test' },
  { label: 'Video', icon: 'solar:play-circle-bold', to: '/video' },
  { label: 'Cộng đồng', icon: 'tabler:messages', to: '/hoi-dap' },
  { label: 'Leaderboard', icon: 'solar:cup-star-bold', to: '/leaderboard' }
];
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur-xl">
    <div class="mx-auto flex h-[68px] max-w-[1320px] items-center gap-3 px-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="mr-2 flex shrink-0 items-center gap-2.5 rounded-xl px-1 py-1 text-ink focus-ring">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-ink text-lg text-white shadow-soft">Đ</span>
        <span class="hidden text-[17px] font-extrabold tracking-[-0.04em] sm:block">Đậu TOEIC</span>
      </NuxtLink>
      <nav class="hidden min-w-0 flex-1 items-center gap-0.5 xl:flex" aria-label="Khu vực học">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="group flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[12px] font-semibold text-ink/65 transition hover:bg-white hover:text-ink focus-ring">
          <span class="text-iris/80 transition group-hover:scale-110"><AppIcon :icon="item.icon" :size="17" /></span>{{ item.label }}
        </NuxtLink>
      </nav>
      <div class="ml-auto flex items-center gap-1.5">
        <NuxtLink to="/upgrade" class="hidden rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-iris focus-ring sm:block">Nâng cấp</NuxtLink>
        <span class="hidden rounded-xl bg-white px-2.5 py-2 text-xs font-bold text-ink/70 sm:block">◷ 13m</span>
        <span class="hidden rounded-xl bg-[#FFF6DF] px-2.5 py-2 text-xs font-bold text-[#9A6A00] sm:block">♨ 1</span>
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
    <div class="flex gap-1 overflow-x-auto border-t border-line/50 px-4 py-2 xl:hidden">
      <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink/65 hover:bg-white focus-ring"><AppIcon :icon="item.icon" :size="16" /> {{ item.label }}</NuxtLink>
    </div>
  </header>
</template>
