<script setup lang="ts">
defineEmits<{ toggleChat: [] }>();
</script>

<template>
  <div class="min-h-screen">
    <TopNav @toggle-chat="$emit('toggleChat')" />
    <main class="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <slot />
    </main>
    <AppButton class="fixed bottom-5 right-5 z-40 rounded-full shadow-float" size="sm" aria-label="Mở chat cộng đồng" @click="$emit('toggleChat')"><AppIcon icon="solar:chat-round-dots-bold" :size="18" /> Chat</AppButton>
  </div>
</template>
