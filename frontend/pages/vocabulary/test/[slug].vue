<script setup lang="ts">
import type { SrsRating, VocabularyWord } from '~/utils/vocabulary';
import { exampleOf, meaningOf, srsRatings } from '~/utils/vocabulary';

type VocabularySetDetail = { id: string; slug: string; title: string; description: string | null; wordCount: number; words: VocabularyWord[] };

const route = useRoute();
const { request, accessToken } = useAppApi();
const toast = useToast();

const slug = computed(() => String(route.params.slug));
const set = ref<VocabularySetDetail | null>(null);
const loading = ref(true);
const notFound = ref(false);

const index = ref(0);
const flipped = ref(false);
const saving = ref(false);
const reviewed = ref<Set<string>>(new Set());

const words = computed(() => set.value?.words ?? []);
const current = computed(() => words.value[index.value] ?? null);
const progress = computed(() => words.value.length ? Math.round((reviewed.value.size / words.value.length) * 100) : 0);

const toneClass: Record<string, string> = {
  blush: 'bg-blush text-[#B5473A]',
  sun: 'bg-sun text-[#A87400]',
  mint: 'bg-mint text-[#46A900]',
  azure: 'bg-azure text-[#1288C8]'
};

async function loadSet() {
  loading.value = true;
  try { set.value = await request<VocabularySetDetail>(`/vocabulary/sets/${slug.value}`); }
  catch { notFound.value = true; }
  finally { loading.value = false; }
}

function advance() {
  flipped.value = false;
  if (index.value < words.value.length - 1) index.value += 1;
}

async function rate(rating: SrsRating) {
  if (!current.value || saving.value) return;
  const entryId = current.value.id;
  if (!accessToken.value) {
    reviewed.value = new Set([...reviewed.value, entryId]);
    advance();
    toast.info('Chưa lưu lịch ôn', 'Đăng nhập để Đậu xếp lịch nhắc lại cho từ này.');
    return;
  }
  saving.value = true;
  try {
    await request('/vocabulary/reviews', { method: 'POST', body: { entryId, rating } });
    reviewed.value = new Set([...reviewed.value, entryId]);
    advance();
  } catch { toast.error('Chưa lưu được đánh giá', 'Kiểm tra kết nối rồi thử lại.'); }
  finally { saving.value = false; }
}

onMounted(loadSet);
</script>

<template>
  <div class="page-enter space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
      <div class="min-w-0">
        <NuxtLink to="/vocabulary" class="inline-flex items-center gap-1.5 text-xs font-bold text-iris hover:underline focus-ring"><AppIcon icon="solar:arrow-left-linear" :size="15" /> Danh sách bộ từ</NuxtLink>
        <h1 class="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">{{ set?.title ?? (loading ? 'Đang mở bộ từ…' : 'Không tìm thấy bộ từ') }}</h1>
        <p v-if="set?.description" class="mt-2 max-w-xl text-sm leading-6 text-ink/55">{{ set.description }}</p>
      </div>
      <div class="rounded-2xl bg-mint px-4 py-3 text-right">
        <p class="text-[11px] font-bold text-ink/50">Đã ôn</p>
        <p class="mt-0.5 text-xl font-extrabold">{{ reviewed.size }} / {{ words.length }}</p>
      </div>
    </div>

    <div v-if="notFound" class="rounded-[22px] border border-line p-8">
      <p class="text-sm font-extrabold">Bộ từ này không còn được publish</p>
      <p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Có thể nó đã bị gỡ hoặc đổi slug. Quay lại danh sách để chọn bộ khác.</p>
      <NuxtLink to="/vocabulary" class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Về danh sách</NuxtLink>
    </div>

    <div v-else class="mx-auto w-full max-w-3xl">
      <div class="h-2 overflow-hidden rounded-full bg-mint" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full rounded-full bg-grass transition-all duration-500" :style="{ width: `${progress}%` }" />
      </div>

      <section v-if="current" class="mt-5 rounded-[22px] border border-line p-5 sm:p-7">
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs font-extrabold text-ink/45">THẺ {{ index + 1 }} / {{ words.length }}</span>
          <span v-if="current.partOfSpeech" class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ current.partOfSpeech }}</span>
        </div>

        <button class="flashcard focus-ring" :aria-pressed="flipped" @click="flipped = !flipped">
          <span class="block text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{{ current.lemma }}</span>
          <span v-if="current.pronunciation" class="mt-2 block text-sm text-white/60">{{ current.pronunciation }}</span>
          <template v-if="flipped">
            <span class="mt-5 block text-lg font-extrabold text-white">{{ meaningOf(current) || 'Chưa có nghĩa cho từ này' }}</span>
            <span v-if="exampleOf(current)" class="mt-3 block text-sm leading-6 text-white/70">{{ exampleOf(current) }}</span>
          </template>
          <span v-else class="mt-5 block text-sm text-white/55">Chạm để lật thẻ</span>
        </button>

        <div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            v-for="rating in srsRatings"
            :key="rating.value"
            :class="['rating-button focus-ring', toneClass[rating.tone]]"
            :disabled="!flipped || saving"
            @click="rate(rating.value)"
          >
            <span class="block text-sm font-extrabold">{{ rating.label }}</span>
            <span class="mt-0.5 block text-[11px] opacity-75">{{ rating.detail }}</span>
          </button>
        </div>
        <p class="mt-3 text-center text-xs text-ink/45">{{ flipped ? 'Chọn mức độ nhớ để Đậu xếp lịch ôn tiếp theo.' : 'Lật thẻ trước khi tự chấm.' }}</p>
      </section>

      <div v-else-if="loading" class="mt-5 rounded-2xl bg-mint p-6 text-sm text-ink/55">Đang tải bộ từ…</div>

      <div v-else class="mt-5 rounded-2xl bg-mint p-6">
        <p class="text-sm font-extrabold">Bộ này chưa có từ nào</p>
        <p class="mt-1.5 text-xs leading-5 text-ink/55">Bộ đã publish nhưng chưa gắn từ vựng.</p>
      </div>

      <div v-if="words.length && reviewed.size === words.length" class="mt-5 rounded-2xl bg-mint p-5 text-center">
        <p class="text-sm font-extrabold">Xong bộ này — {{ words.length }} từ đã đi qua một lượt.</p>
        <NuxtLink to="/vocabulary" class="mt-3 inline-flex text-xs font-bold text-iris hover:underline focus-ring">Chọn bộ tiếp theo →</NuxtLink>
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
  transition: translate .2s ease, box-shadow .2s ease;
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
