<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { IconifyIcon } from '@iconify/types';
import solarArrowLeft from '@iconify-icons/solar/arrow-left-linear';
import solarArrowRight from '@iconify-icons/solar/arrow-right-linear';
import solarArrowRightUp from '@iconify-icons/solar/arrow-right-up-linear';
import solarBolt from '@iconify-icons/solar/bolt-circle-bold';
import solarBell from '@iconify-icons/solar/bell-bing-bold';
import solarBook from '@iconify-icons/solar/book-2-bold';
import solarBookmark from '@iconify-icons/solar/book-bookmark-bold';
import solarChat from '@iconify-icons/solar/chat-round-dots-bold';
import solarChart from '@iconify-icons/solar/chart-2-bold';
import solarCheckCircle from '@iconify-icons/solar/check-circle-bold';
import solarCloudUpload from '@iconify-icons/solar/cloud-upload-bold';
import solarClipboard from '@iconify-icons/solar/clipboard-list-bold';
import solarClock from '@iconify-icons/solar/clock-circle-bold';
import solarClose from '@iconify-icons/solar/close-circle-bold';
import solarCup from '@iconify-icons/solar/cup-star-bold';
import solarDocument from '@iconify-icons/solar/document-text-bold';
import solarFire from '@iconify-icons/solar/fire-bold';
import solarGallery from '@iconify-icons/solar/gallery-round-bold';
import solarHeadphones from '@iconify-icons/solar/headphones-round-sound-bold';
import solarMedal from '@iconify-icons/solar/medal-ribbon-star-bold';
import solarLibrary from '@iconify-icons/solar/library-bold';
import solarLock from '@iconify-icons/solar/lock-keyhole-minimalistic-bold';
import solarMusicLibrary from '@iconify-icons/solar/music-library-2-bold';
import solarPen from '@iconify-icons/solar/pen-new-square-bold';
import solarPlay from '@iconify-icons/solar/play-circle-bold';
import solarRecord from '@iconify-icons/solar/record-circle-bold';
import solarShare from '@iconify-icons/solar/share-bold';
import solarTarget from '@iconify-icons/solar/target-bold';
import solarUpload from '@iconify-icons/solar/upload-minimalistic-bold';
import solarUser from '@iconify-icons/solar/user-circle-bold-duotone';
import solarUsersGroup from '@iconify-icons/solar/users-group-rounded-bold';
import tablerDevices from '@iconify-icons/tabler/devices';
import tablerMessages from '@iconify-icons/tabler/messages';

const iconMap: Record<string, IconifyIcon> = {
  'solar:arrow-left-linear': solarArrowLeft,
  'solar:arrow-right-linear': solarArrowRight,
  'solar:arrow-right-up-linear': solarArrowRightUp,
  'solar:bolt-circle-bold': solarBolt,
  'solar:bell-bing-bold': solarBell,
  'solar:book-2-bold': solarBook,
  'solar:book-bookmark-bold': solarBookmark,
  'solar:chat-round-dots-bold': solarChat,
  'solar:chart-2-bold': solarChart,
  'solar:check-circle-bold': solarCheckCircle,
  'solar:cloud-upload-bold': solarCloudUpload,
  'solar:clipboard-list-bold': solarClipboard,
  'solar:clock-circle-bold': solarClock,
  'solar:close-circle-bold': solarClose,
  'solar:cup-star-bold': solarCup,
  'solar:document-text-bold': solarDocument,
  'solar:fire-bold': solarFire,
  'solar:gallery-round-bold': solarGallery,
  'solar:headphones-round-sound-bold': solarHeadphones,
  'solar:medal-ribbon-star-bold': solarMedal,
  'solar:library-bold': solarLibrary,
  'solar:lock-keyhole-minimalistic-bold': solarLock,
  'solar:music-library-2-bold': solarMusicLibrary,
  'solar:pen-new-square-bold': solarPen,
  'solar:play-circle-bold': solarPlay,
  'solar:record-circle-bold': solarRecord,
  'solar:share-bold': solarShare,
  'solar:target-bold': solarTarget,
  'solar:upload-minimalistic-bold': solarUpload,
  'solar:user-circle-bold-duotone': solarUser,
  'solar:users-group-rounded-bold': solarUsersGroup,
  'tabler:devices': tablerDevices,
  'tabler:messages': tablerMessages
};

const props = withDefaults(defineProps<{ icon: string; size?: number | string }>(), { size: 20 });
const resolvedIcon = computed(() => iconMap[props.icon] ?? props.icon);
</script>

<template>
  <Icon :icon="resolvedIcon" :width="size" :height="size" aria-hidden="true" />
</template>
