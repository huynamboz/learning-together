<script setup lang="ts">
const { request, accessToken } = useAppApi();
const selected = ref('B');
const checked = ref(false);
const loading = ref(false);
const message = ref('');
type PracticeQuestion = { id: string; prompt: Record<string, unknown>; options: Array<{ key: string; text: Record<string, unknown> }> };
const question = ref({ id: '', prompt: 'The marketing team will present the new campaign ____ Monday morning.', options: [{ key: 'A', label: 'at' }, { key: 'B', label: 'on' }, { key: 'C', label: 'in' }, { key: 'D', label: 'by' }], answer: 'B' });

function textOf(value: Record<string, unknown>) { return typeof value.text === 'string' ? value.text : ''; }
onMounted(async () => {
  try {
    const [remote] = await request<PracticeQuestion[]>('/practice/questions', { query: { kind: 'GRAMMAR', part: 5, limit: 1 } });
    if (remote) question.value = { id: remote.id, prompt: textOf(remote.prompt), options: remote.options.map((option) => ({ key: option.key, label: textOf(option.text) })), answer: '' };
  } catch { /* The fallback card remains usable offline. */ }
});

async function checkAnswer() {
  if (checked.value) { checked.value = false; message.value = ''; return; }
  checked.value = true;
  message.value = question.value.answer && selected.value === question.value.answer ? 'Chính xác — “on Monday” là cụm chỉ ngày.' : question.value.answer ? 'Chưa đúng. Hãy nhớ: on + ngày trong tuần.' : 'Đáp án đang được chấm bởi server.';
  if (accessToken.value && question.value.id) {
    loading.value = true;
    try { const result = await request<{ isCorrect: boolean }>('/learning/attempts', { method: 'POST', body: { questionId: question.value.id, context: 'PRACTICE', selectedAnswer: selected.value } }); message.value = result.isCorrect ? 'Chính xác — tiến bộ của bạn đã được lưu.' : 'Chưa đúng. Hãy xem giải thích và thử thêm một câu nữa.'; } catch { message.value += ' Phiên đồng bộ sẽ thử lại sau.'; } finally { loading.value = false; }
  }
}
</script>

<template>
  <div class="page-enter space-y-6"><section class="rounded-[26px] bg-[#E8F7FF] p-6 shadow-soft sm:p-9"><p class="text-xs font-extrabold tracking-[0.18em] text-iris">READING LAB · GRAMMAR</p><div class="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h1 class="text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Đọc nhanh, hiểu sâu.</h1><p class="mt-3 max-w-xl text-sm leading-6 text-ink/60">Một câu hỏi, một điểm ngữ pháp, một lần giải thích đủ rõ để lần sau nhận ra ngay.</p></div><span class="rounded-xl bg-white/70 px-3 py-2 text-xs font-extrabold text-ink/60">Grammar · Cơ bản</span></div></section><section class="mx-auto max-w-3xl rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-8"><div class="flex items-center justify-between"><span class="text-xs font-extrabold text-ink/45">CÂU 01 / 10</span><span class="text-xs font-bold text-ink/45">Reading · 2 phút</span></div><h2 class="mt-7 text-2xl font-extrabold leading-tight tracking-[-0.04em]">{{ question.prompt }}</h2><div class="mt-7 grid gap-3 sm:grid-cols-2"><label v-for="option in question.options" :key="option.key" :class="['flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition', selected === option.key ? 'border-iris bg-iris/5' : 'border-line hover:border-iris/40']"><input v-model="selected" class="sr-only" type="radio" name="reading-answer" :value="option.key" @change="checked = false"><span :class="['grid h-8 w-8 place-items-center rounded-lg text-xs font-extrabold', selected === option.key ? 'bg-iris text-white' : 'bg-paper text-ink/60']">{{ option.key }}</span><span class="text-sm font-bold">{{ option.label }}</span></label></div><div v-if="checked" :class="['mt-6 rounded-2xl p-4 text-sm leading-6', message.startsWith('Chính xác') ? 'bg-leaf/10 text-ink' : 'bg-bean/15 text-ink']"><p class="font-extrabold">{{ message }}</p><p class="mt-1 text-xs text-ink/60">Giải thích: ngày cụ thể đi với giới từ “on”.</p></div><div class="mt-7 flex justify-end"><AppButton :loading="loading" @click="checkAnswer">{{ loading ? 'Đang lưu...' : checked ? 'Làm lại câu' : 'Kiểm tra đáp án' }}</AppButton></div></section></div>
</template>
