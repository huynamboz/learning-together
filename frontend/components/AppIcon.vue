<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { IconifyIcon } from '@iconify/types';
import solarArrowLeft from '@iconify-icons/solar/arrow-left-linear';
import solarBell from '@iconify-icons/solar/bell-bing-bold';
import solarBook from '@iconify-icons/solar/book-2-bold';
import solarBookmark from '@iconify-icons/solar/book-bookmark-bold';
import solarChat from '@iconify-icons/solar/chat-round-dots-bold';
import solarClipboard from '@iconify-icons/solar/clipboard-list-bold';
import solarCup from '@iconify-icons/solar/cup-star-bold';
import solarHeadphones from '@iconify-icons/solar/headphones-round-sound-bold';
import solarLock from '@iconify-icons/solar/lock-keyhole-minimalistic-bold';
import solarPen from '@iconify-icons/solar/pen-new-square-bold';
import solarPlay from '@iconify-icons/solar/play-circle-bold';
import solarShare from '@iconify-icons/solar/share-bold';
import solarUser from '@iconify-icons/solar/user-circle-bold-duotone';
import tablerDevices from '@iconify-icons/tabler/devices';
import tablerMessages from '@iconify-icons/tabler/messages';

const iconMap: Record<string, IconifyIcon> = {
  'solar:arrow-left-linear': solarArrowLeft,
  'solar:bell-bing-bold': solarBell,
  'solar:book-2-bold': solarBook,
  'solar:book-bookmark-bold': solarBookmark,
  'solar:chat-round-dots-bold': solarChat,
  'solar:clipboard-list-bold': solarClipboard,
  'solar:cup-star-bold': solarCup,
  'solar:headphones-round-sound-bold': solarHeadphones,
  'solar:lock-keyhole-minimalistic-bold': solarLock,
  'solar:pen-new-square-bold': solarPen,
  'solar:play-circle-bold': solarPlay,
  'solar:share-bold': solarShare,
  'solar:user-circle-bold-duotone': solarUser,
  'tabler:devices': tablerDevices,
  'tabler:messages': tablerMessages
};

const props = withDefaults(defineProps<{ icon: string; size?: number | string }>(), { size: 20 });
const resolvedIcon = computed(() => iconMap[props.icon] ?? props.icon);
</script>

<template>
  <Icon :icon="resolvedIcon" :width="size" :height="size" aria-hidden="true" />
</template>
