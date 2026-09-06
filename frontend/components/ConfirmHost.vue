<script setup lang="ts">
const { request, busy, accept, reject } = useConfirm();
</script>

<template>
  <AppDialog
    :open="Boolean(request)"
    :title="request?.title ?? ''"
    :description="request?.description"
    :confirm-label="request?.confirmLabel ?? 'Xác nhận'"
    :cancel-label="request?.cancelLabel ?? 'Huỷ'"
    :tone="request?.tone ?? 'default'"
    :icon="request?.icon"
    :busy="busy"
    @confirm="accept"
    @cancel="reject"
  />
</template>
