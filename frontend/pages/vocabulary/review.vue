<script setup lang="ts">
import type { SrsRating, VocabularyWord } from '~/utils/vocabulary';
import { exampleOf, meaningOf, srsRatings } from '~/utils/vocabulary';

type DueCard = { id: string; entryId: string; state: string; dueAt: string; entry: VocabularyWord };

const { request, accessToken } = useAppApi();
const toast = useToast();

const queue = ref<DueCard[]>([]);
const loading = ref(true);
const index = ref(0);
const flipped = ref(false);
const saving = ref(false);
const done = ref(0);

const current = computed(() => queue.value[index.value] ?? null);
const total = computed(() => queue.value.length);
const progress = computed(() => total.value ? Math.round((done.value / total.value) * 100) : 0);

const toneClass: Record<string, string> = {
  blush: 'bg-blush text-[#B5473A]',
  sun: 'bg-sun text-[#A87400]',
  mint: 'bg-mint text-[#46A900]',
  azure: 'bg-azure text-[#1288C8]'
};

async function loadQueue() {
  if (!accessToken.value) { loading.value = false; return; }
  loading.value = true;
  try { queue.value = await request<DueCard[]>('/vocabulary/review-queue', { query: { limit: 50 } }); }
  catch { toast.error('Chưa tải được hàng đợi ôn tập', 'Kiểm tra phiên đăng nhập rồi thử lại.'); }
  finally { loading.value = false; }
}

async function rate(rating: SrsRating) {
  if (!current.value || saving.value) return;
  saving.value = true;
  try {
    await request('/vocabulary/reviews', { method: 'POST', body: { entryId: current.value.entryId, rating } });
    done.value += 1;
    flipped.value = false;
    if (index.value < queue.value.length - 1) index.value += 1;
    else index.value = queue.value.length;
  } catch { toast.error('Chưa lưu được đánh giá', 'Kiểm tra kết nối rồi thử lại.'); }
  finally { saving.value = false; }
}

onMounted(loadQueue);
</script>

<template>
  <div class="page-enter space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
      <div class="min-w-0">
        <NuxtLink to="/vocabulary" class="inline-flex items-center gap-1.5 text-xs font-bold text-iris hover:underline focus-ring"><AppIcon icon="solar:arrow-left-linear" :size="15" /> Khu vực từ vựng</NuxtLink>
        <h1 class="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Ôn thẻ đến hạn</h1>
        <p class="mt-2 max-w-xl text-sm leading-6 text-ink/55">Đậu chỉ đưa ra những thẻ đã tới hạn hôm nay. Tự chấm thật để lịch ôn bám đúng trí nhớ của bạn.</p>
      </div>
      <div class="rounded-2xl bg-mint px-4 py-3 text-right">
        <p class="text-[11px] font-bold text-ink/50">Đã ôn</p>
        <p class="mt-0.5 text-xl font-extrabold">{{ done }} / {{ total }}</p>
      </div>
    </div>

    <div v-if="!accessToken" class="rounded-[22px] border border-line p-8">
      <p class="text-sm font-extrabold">Cần đăng nhập để ôn theo lịch</p>
      <p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Lịch ôn được tính riêng cho từng người học, nên phiên ôn cần một tài khoản.</p>
      <NuxtLink to="/account" class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Đăng nhập</NuxtLink>
    </div>

    <div v-else class="mx-auto w-full max-w-3xl">
      <div class="h-2 overflow-hidden rounded-full bg-mint" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full rounded-full bg-grass transition-all duration-500" :style="{ width: `${progress}%` }" />
      </div>

      <section v-if="current" class="mt-5 rounded-[22px] border border-line p-5 sm:p-7">
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs font-extrabold text-ink/45">THẺ {{ index + 1 }} / {{ total }}</span>
          <span class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ current.state }}</span>
        </div>

        <button class="flashcard focus-ring" :aria-pressed="flipped" @click="flipped = !flipped">
          <span class="block text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{{ current.entry.lemma }}</span>
          <span v-if="current.entry.pronunciation" class="mt-2 block text-sm text-white/60">{{ current.entry.pronunciation }}</span>
          <template v-if="flipped">
            <span class="mt-5 block text-lg font-extrabold text-white">{{ meaningOf(current.entry) || 'Chưa có nghĩa cho từ này' }}</span>
            <span v-if="exampleOf(current.entry)" class="mt-3 block text-sm leading-6 text-white/70">{{ exampleOf(current.entry) }}</span>
          </template>
          <span v-else class="mt-5 block text-sm text-white/55">Chạm để lật thẻ</span>
        </button>

        <div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button v-for="rating in srsRatings" :key="rating.value" :class="['rating-button focus-ring', toneClass[rating.tone]]" :disabled="!flipped || saving" @click="rate(rating.value)">
            <span class="block text-sm font-extrabold">{{ rating.label }}</span>
            <span class="mt-0.5 block text-[11px] opacity-75">{{ rating.detail }}</span>
          </button>
        </div>
        <p class="mt-3 text-center text-xs text-ink/45">{{ flipped ? 'Chọn mức độ nhớ để Đậu xếp lịch tiếp theo.' : 'Lật thẻ trước khi tự chấm.' }}</p>
      </section>

      <div v-else-if="loading" class="mt-5 rounded-2xl bg-mint p-6 text-sm text-ink/55">Đang tải hàng đợi ôn tập…</div>

      <div v-else class="mt-5 rounded-2xl bg-mint p-6 text-center">
        <p class="text-sm font-extrabold">{{ done ? `Xong phiên ôn — ${done} thẻ đã được xếp lịch lại.` : 'Hôm nay không còn thẻ nào đến hạn.' }}</p>
        <p class="mt-1.5 text-xs leading-5 text-ink/55">Học thêm một bộ từ mới để tạo thẻ cho những phiên ôn sau.</p>
        <NuxtLink to="/vocabulary" class="cta-sky mt-4 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Chọn bộ từ</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flashcard {
  display: block;
  width: 100%;
  margin-top: 1.25rem;
  min-height: 15rem;
  border-radius: 24px;
  corner-shape: squircle;
  background: var(--ink);
  padding: 2.25rem 1.5rem;
  text-align: center;
  color: #fff;
  transition: translate .2s ease;
}
.flashcard:hover { translate: 0 -2px; }

.rating-button {
  border-radius: 16px;
  corner-shape: squircle;
  padding: .75rem .5rem;
  transition: translate .15s ease, opacity .15s ease;
}
.rating-button:hover:not(:disabled) { translate: 0 -2px; }
.rating-button:disabled { opacity: .45; cursor: not-allowed; }
</style>
