<script setup lang="ts">
const chatOpen = ref(false);
</script>

<template>
  <div class="min-h-screen bg-paper text-ink">
    <AppShell @toggle-chat="chatOpen = !chatOpen">
      <slot />
    </AppShell>
    <ChatDock v-if="chatOpen" @close="chatOpen = false" />
  </div>
</template>
