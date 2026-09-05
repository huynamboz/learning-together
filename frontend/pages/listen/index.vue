<script setup lang="ts">
const mode = ref<'dictation' | 'type'>('dictation');
const part = ref(1);
const playing = ref(false);
const progress = ref(28);
const transcriptVisible = ref(false);
const answer = ref('');
const checked = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;

const prompts = { 1: 'A group of people are standing near a building.', 2: 'The speaker is describing a change to a schedule.', 3: 'You will hear a question and three possible responses.' };

function togglePlay() {
  playing.value = !playing.value;
  if (playing.value) timer = setInterval(() => { progress.value = progress.value >= 100 ? 0 : progress.value + 1; }, 800);
  else if (timer) clearInterval(timer);
}
function checkAnswer() { checked.value = true; }
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <div class="page-enter space-y-6">
    <section class="rounded-[26px] bg-ink p-6 text-white shadow-float sm:p-9"><div class="flex flex-wrap items-start justify-between gap-5"><div><p class="text-xs font-extrabold tracking-[0.18em] text-bean">LISTENING LAB</p><h1 class="mt-3 text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Nghe để bắt nhịp.</h1><p class="mt-3 max-w-xl text-sm leading-6 text-white/65">Tập trung vào một đoạn ngắn, đoán ý chính rồi soi transcript. Mỗi lần nghe đều phải để lại một manh mối.</p></div><div class="rounded-2xl bg-white/10 px-4 py-3 text-right"><p class="text-[11px] text-white/55">Phiên hôm nay</p><p class="mt-1 text-xl font-extrabold">01:20</p></div></div><div class="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Chế độ luyện nghe"><button v-for="item in [{ key: 'dictation', label: 'Dictation' }, { key: 'type', label: 'Nghe chọn đáp án' }]" :key="item.key" :class="['rounded-xl px-4 py-2.5 text-xs font-bold transition focus-ring', mode === item.key ? 'bg-bean text-ink' : 'bg-white/10 text-white/70 hover:bg-white/15']" @click="mode = item.key as 'dictation' | 'type'">{{ item.label }}</button></div></section>
    <div class="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><aside class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6"><p class="text-xs font-extrabold text-ink/45">CHỌN PART</p><div class="mt-4 grid grid-cols-3 gap-2"><button v-for="item in [1, 2, 3]" :key="item" :class="['rounded-xl border px-3 py-3 text-xs font-extrabold transition focus-ring', part === item ? 'border-iris bg-iris text-white' : 'border-line hover:border-iris/40']" @click="part = item">Part {{ item }}</button></div><div class="mt-6 rounded-2xl bg-paper p-4"><p class="text-xs font-bold">Mẹo của Đậu</p><p class="mt-2 text-xs leading-5 text-ink/55">Nghe lần đầu không nhìn chữ. Hãy ghi lại từ khoá và dự đoán ngữ cảnh trước khi xem transcript.</p></div></aside><section class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-8"><div class="flex items-center justify-between gap-3"><div><p class="text-xs font-extrabold text-ink/45">PART {{ part }} · CÂU {{ part }}</p><h2 class="mt-1 text-xl font-extrabold tracking-[-0.04em]">Một đoạn ngắn để khởi động</h2></div><span class="rounded-lg bg-leaf/15 px-2 py-1 text-[11px] font-bold text-leaf">Dễ</span></div><div class="mt-6 rounded-2xl bg-[#E9E9FF] p-5"><div class="flex items-center gap-4"><button class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-xl text-white shadow-soft transition hover:bg-iris focus-ring" :aria-label="playing ? 'Tạm dừng audio' : 'Phát audio'" @click="togglePlay">{{ playing ? 'Ⅱ' : '▶' }}</button><div class="min-w-0 flex-1"><div class="flex justify-between text-[11px] font-bold text-ink/50"><span>Audio TOEIC</span><span>{{ progress }}%</span></div><div class="mt-2 h-2 rounded-full bg-white/80"><div class="h-full rounded-full bg-iris transition-all" :style="{ width: `${progress}%` }" /></div></div></div></div><p class="mt-5 text-sm leading-7 text-ink/70">{{ prompts[part as keyof typeof prompts] }}</p><button class="mt-4 text-xs font-bold text-iris hover:underline focus-ring" @click="transcriptVisible = !transcriptVisible">{{ transcriptVisible ? 'Ẩn transcript' : 'Xem transcript' }}</button><p v-if="transcriptVisible" class="mt-3 rounded-xl bg-paper p-3 text-xs leading-6 text-ink/65">Transcript mẫu: {{ prompts[part as keyof typeof prompts] }}</p><div class="mt-6 border-t border-line pt-5"><label class="text-xs font-bold" for="listen-answer">{{ mode === 'dictation' ? 'Chép lại điều bạn nghe được' : 'Bạn chọn đáp án nào?' }}</label><textarea id="listen-answer" v-model="answer" rows="3" class="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-iris" placeholder="Viết câu trả lời của bạn..." /><div class="mt-3 flex flex-wrap items-center justify-between gap-3"><span v-if="checked" class="text-xs font-bold text-leaf">Đã ghi nhận câu trả lời. Hãy so với transcript và thử lại.</span><span v-else /> <button class="rounded-xl bg-ink px-4 py-3 text-xs font-extrabold text-white transition hover:bg-iris disabled:opacity-40 focus-ring" :disabled="!answer.trim()" @click="checkAnswer">Kiểm tra câu</button></div></div></section></div>
  </div>
</template>
