<script setup lang="ts">
const { request, accessToken } = useAppApi();
const cards = ref([{ id: '', word: 'allocate', meaning: 'phân bổ', example: 'We need to allocate more time to training.', tag: 'Workplace' }, { id: '', word: 'deadline', meaning: 'hạn chót', example: 'The deadline for applications is Friday.', tag: 'Business' }, { id: '', word: 'negotiate', meaning: 'đàm phán', example: 'They negotiated a better contract.', tag: 'Meeting' }]);
const index = ref(0); const revealed = ref(false); const reviewed = ref(0); const busy = ref(false); const notice = ref('');
const current = computed(() => cards.value[index.value]);

function firstText(value: unknown, key: string) {
  if (!Array.isArray(value) || !value[0] || typeof value[0] !== 'object') return '';
  const item = value[0] as Record<string, unknown>;
  return typeof item[key] === 'string' ? item[key] : '';
}
onMounted(async () => {
  if (!accessToken.value) return;
  try {
    const queue = await request<Array<{ entry: { id: string; lemma: string; meanings: unknown; examples: unknown; partOfSpeech?: string | null } }>>('/vocabulary/review-queue', { query: { limit: 20 } });
    if (queue.length) {
      cards.value = queue.map(({ entry }) => ({ id: entry.id, word: entry.lemma, meaning: firstText(entry.meanings, 'vi') || 'Đang cập nhật nghĩa', example: firstText(entry.examples, 'en'), tag: entry.partOfSpeech ?? 'TOEIC' }));
      notice.value = 'Đã tải hàng đợi ôn tập của bạn.';
    }
  } catch { notice.value = 'Không tải được hàng đợi; bạn vẫn có thể ôn bộ thẻ mẫu.'; }
});

async function review(rating: 'again' | 'hard' | 'good' | 'easy') {
  if (!current.value || busy.value) return;
  busy.value = true;
  if (accessToken.value && current.value.id) { try { await request('/vocabulary/reviews', { method: 'POST', body: { entryId: current.value.id, rating } }); } catch { notice.value = 'Chưa đồng bộ được, nhưng nhịp ôn của bạn vẫn tiếp tục.'; } }
  reviewed.value += 1; revealed.value = false; index.value = (index.value + 1) % cards.value.length; busy.value = false;
}
</script>

<template>
  <div class="page-enter space-y-6"><section class="rounded-[26px] bg-[#FFF6DF] p-6 shadow-soft sm:p-9"><div class="flex flex-wrap items-end justify-between gap-4"><div><p class="text-xs font-extrabold tracking-[0.18em] text-[#A87400]">VOCABULARY · SRS</p><h1 class="mt-3 text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Từ vựng có nhịp ôn.</h1><p class="mt-3 max-w-xl text-sm leading-6 text-ink/60">Lật thẻ, tự nhớ, rồi chọn mức độ khó. Đậu sẽ xếp lịch cho lần gặp tiếp theo.</p></div><div class="rounded-2xl bg-white/70 px-4 py-3 text-right"><p class="text-[11px] text-ink/45">Đã ôn</p><p class="mt-1 text-xl font-extrabold">{{ reviewed }} / {{ cards.length }}</p></div></div></section><section class="mx-auto max-w-2xl rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-8"><div class="flex justify-between text-xs font-extrabold text-ink/45"><span>THẺ {{ index + 1 }}</span><span>{{ current.tag }}</span></div><button class="mt-5 flex min-h-64 w-full flex-col items-center justify-center rounded-2xl bg-ink px-6 text-center text-white transition hover:bg-[#252f58] focus-ring" :aria-label="revealed ? 'Ẩn nghĩa của từ' : 'Hiện nghĩa của từ'" @click="revealed = !revealed"><span class="text-4xl font-extrabold tracking-[-0.06em]">{{ current.word }}</span><span class="mt-4 text-xs text-white/55">{{ revealed ? current.meaning : 'Chạm để lật thẻ' }}</span><span v-if="revealed" class="mt-5 max-w-sm text-sm leading-6 text-white/75">“{{ current.example }}”</span></button><p v-if="notice" class="mt-4 text-xs font-bold text-[#A87400]">{{ notice }}</p><div class="mt-6 grid grid-cols-4 gap-2"><button v-for="item in [{ key: 'again', label: 'Lại', tone: 'bg-[#FFE6E2] text-[#B5473A]' }, { key: 'hard', label: 'Khó', tone: 'bg-[#FFF6DF] text-[#A87400]' }, { key: 'good', label: 'Ổn', tone: 'bg-leaf/15 text-[#28896D]' }, { key: 'easy', label: 'Dễ', tone: 'bg-iris/10 text-iris' }]" :key="item.key" :class="['rounded-xl px-2 py-3 text-xs font-extrabold transition hover:-translate-y-0.5 disabled:opacity-40 focus-ring', item.tone]" :disabled="!revealed || busy" @click="review(item.key as 'again' | 'hard' | 'good' | 'easy')">{{ item.label }}</button></div></section></div>
</template>
