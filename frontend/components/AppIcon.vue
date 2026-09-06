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
import solarAltArrowDown from '@iconify-icons/solar/alt-arrow-down-linear';
import solarAltArrowLeft from '@iconify-icons/solar/alt-arrow-left-linear';
import solarAltArrowRight from '@iconify-icons/solar/alt-arrow-right-linear';
import solarCheckRead from '@iconify-icons/solar/check-read-bold';
import solarCompass from '@iconify-icons/solar/compass-bold';
import solarCpuBolt from '@iconify-icons/solar/cpu-bolt-bold';
import solarDangerTriangle from '@iconify-icons/solar/danger-triangle-bold';
import solarDiploma from '@iconify-icons/solar/diploma-verified-bold';
import solarHourglass from '@iconify-icons/solar/hourglass-bold';
import solarInfoCircle from '@iconify-icons/solar/info-circle-bold';
import solarLinkCircle from '@iconify-icons/solar/link-circle-bold';
import solarLockKeyhole from '@iconify-icons/solar/lock-keyhole-bold';
import solarMapPointWave from '@iconify-icons/solar/map-point-wave-bold';
import solarMicrophone from '@iconify-icons/solar/microphone-large-bold';
import solarMonitorSmartphone from '@iconify-icons/solar/monitor-smartphone-bold';
import solarRoute from '@iconify-icons/solar/route-bold';
import solarSoundwave from '@iconify-icons/solar/soundwave-square-bold';
import solarTextSquare from '@iconify-icons/solar/text-square-bold';
import solarTrashBin from '@iconify-icons/solar/trash-bin-trash-bold';
import tablerDevices from '@iconify-icons/tabler/devices';
import tablerMessages from '@iconify-icons/tabler/messages';

/**
 * Every icon the app draws is imported here. An unmapped name falls through to Iconify's remote
 * API, which renders nothing offline and costs a request per icon — so a missing entry looks like
 * a blank space rather than an error.
 */
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
  'solar:alt-arrow-down-linear': solarAltArrowDown,
  'solar:alt-arrow-left-linear': solarAltArrowLeft,
  'solar:alt-arrow-right-linear': solarAltArrowRight,
  'solar:check-read-bold': solarCheckRead,
  'solar:compass-bold': solarCompass,
  'solar:cpu-bolt-bold': solarCpuBolt,
  'solar:danger-triangle-bold': solarDangerTriangle,
  'solar:diploma-verified-bold': solarDiploma,
  'solar:hourglass-bold': solarHourglass,
  'solar:info-circle-bold': solarInfoCircle,
  'solar:link-circle-bold': solarLinkCircle,
  'solar:lock-keyhole-bold': solarLockKeyhole,
  'solar:map-point-wave-bold': solarMapPointWave,
  'solar:microphone-large-bold': solarMicrophone,
  'solar:monitor-smartphone-bold': solarMonitorSmartphone,
  'solar:route-bold': solarRoute,
  'solar:soundwave-square-bold': solarSoundwave,
  'solar:text-square-bold': solarTextSquare,
  'solar:trash-bin-trash-bold': solarTrashBin,
  'tabler:devices': tablerDevices,
  'tabler:messages': tablerMessages
};

const props = withDefaults(defineProps<{ icon: string; size?: number | string }>(), { size: 20 });
const resolvedIcon = computed(() => iconMap[props.icon] ?? props.icon);
</script>

<template>
  <Icon :icon="resolvedIcon" :width="size" :height="size" aria-hidden="true" />
</template>
