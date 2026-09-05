<script setup lang="ts">
defineEmits<{ toggleChat: [] }>();
</script>

<template>
  <div class="min-h-screen">
    <TopNav @toggle-chat="$emit('toggleChat')" />
    <main class="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <slot />
    </main>
    <button class="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-xs font-extrabold text-white shadow-float transition hover:-translate-y-0.5 hover:bg-iris focus-ring" aria-label="Mở chat cộng đồng" @click="$emit('toggleChat')">⌁ Chat</button>
  </div>
</template>
