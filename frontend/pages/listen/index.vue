<script setup lang="ts">
type PublishedContent = { id: string; title: string; part: number | null; level: number | null; payload: Record<string, unknown> };
type ListeningLesson = { id: string; title: string; part: number; level: number; transcript: string; durationSec: number; source: 'live' | 'fallback' };
const { request, accessToken } = useAppApi();
const mode = ref<'dictation' | 'type'>('dictation');
const part = ref(1);
const playing = ref(false);
const playedSeconds = ref(0);
const transcriptVisible = ref(false);
const answer = ref('');
const checked = ref(false);
const saving = ref(false);
const notice = ref('');
const liveLessons = ref<ListeningLesson[]>([]);
let timer: ReturnType<typeof setInterval> | undefined;

const fallbackLessons: ListeningLesson[] = [
  { id: 'fallback-1', title: 'Part 1 · Khởi động với tranh', part: 1, level: 1, transcript: 'A group of people are standing near a building.', durationSec: 22, source: 'fallback' },
  { id: 'fallback-2', title: 'Part 2 · Nhận diện ý chính', part: 2, level: 1, transcript: 'The speaker is describing a change to a schedule.', durationSec: 18, source: 'fallback' },
  { id: 'fallback-3', title: 'Part 3 · Câu hỏi và phản hồi', part: 3, level: 1, transcript: 'You will hear a question and three possible responses.', durationSec: 20, source: 'fallback' }
];
const lesson = computed(() => liveLessons.value.find((item) => item.part === part.value) ?? fallbackLessons.find((item) => item.part === part.value) ?? fallbackLessons[0]);
const progress = computed(() => Math.min(100, Math.round((playedSeconds.value / lesson.value.durationSec) * 100)));
const sessionClock = computed(() => `00:${String(playedSeconds.value).padStart(2, '0')}`);

function textOf(value: unknown) { return typeof value === 'string' ? value : ''; }
function numberOf(value: unknown, fallback: number) { return typeof value === 'number' && Number.isFinite(value) ? value : fallback; }
async function loadLessons() {
  try {
    const content = await request<PublishedContent[]>('/content', { query: { type: 'LISTENING' } });
    liveLessons.value = content.map((item) => ({ id: item.id, title: item.title, part: item.part ?? 1, level: item.level ?? 1, transcript: textOf(item.payload.transcript), durationSec: numberOf(item.payload.durationSec, 20), source: 'live' as const })).filter((item) => item.transcript);
  } catch { notice.value = 'Chưa tải được kho nghe; đang dùng bài mẫu trên thiết bị này.'; }
}

function togglePlay() {
  playing.value = !playing.value;
  if (playing.value) timer = setInterval(() => {
    if (playedSeconds.value >= lesson.value.durationSec) { playedSeconds.value = 0; }
    playedSeconds.value += 1;
    if (playedSeconds.value >= lesson.value.durationSec) { playing.value = false; if (timer) clearInterval(timer); timer = undefined; }
  }, 1000);
  else if (timer) clearInterval(timer);
}
function selectPart(nextPart: number) { if (timer) clearInterval(timer); playing.value = false; part.value = nextPart; playedSeconds.value = 0; checked.value = false; answer.value = ''; notice.value = ''; }
async function checkAnswer() {
  checked.value = true; notice.value = '';
  if (!accessToken.value || lesson.value.source !== 'live' || playedSeconds.value < 1) return;
  saving.value = true;
  try { await request('/learning/study-sessions', { method: 'POST', body: { surface: 'listening', durationSeconds: Math.max(1, playedSeconds.value) } }); notice.value = 'Đã lưu thời lượng luyện nghe vào tiến độ của bạn.'; }
  catch { notice.value = 'Chưa đồng bộ được thời lượng. Bạn vẫn có thể đối chiếu transcript và thử lại.'; }
  finally { saving.value = false; }
}
onMounted(loadLessons);
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<template>
  <div class="page-enter space-y-6">
    <section class="rounded-[26px] bg-ink p-6 text-white shadow-float sm:p-9"><div class="flex flex-wrap items-start justify-between gap-5"><div class="min-w-0"><p class="text-xs font-extrabold tracking-[0.18em] text-bean">LISTENING LAB</p><h1 class="mt-3 text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Nghe để bắt nhịp.</h1><p class="mt-3 max-w-xl text-sm leading-6 text-white/65">Tập trung vào một đoạn ngắn, đoán ý chính rồi soi transcript. Mỗi lần nghe đều phải để lại một manh mối.</p></div><div class="rounded-2xl bg-white/10 px-4 py-3 text-right"><p class="text-[11px] text-white/55">Đã nghe phiên này</p><p class="mt-1 text-xl font-extrabold">{{ sessionClock }}</p></div></div><div class="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Chế độ luyện nghe"><button v-for="item in [{ key: 'dictation', label: 'Dictation' }, { key: 'type', label: 'Nghe chọn đáp án' }]" :key="item.key" :class="['rounded-xl px-4 py-2.5 text-xs font-bold transition focus-ring', mode === item.key ? 'bg-bean text-ink' : 'bg-white/10 text-white/70 hover:bg-white/15']" @click="mode = item.key as 'dictation' | 'type'">{{ item.label }}</button></div></section>
    <div class="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><aside class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6"><p class="text-xs font-extrabold text-ink/45">CHỌN PART</p><div class="mt-4 grid grid-cols-3 gap-2"><button v-for="item in [1, 2, 3]" :key="item" :class="['rounded-xl border px-3 py-3 text-xs font-extrabold transition focus-ring', part === item ? 'border-iris bg-iris text-white' : 'border-line hover:border-iris/40']" @click="selectPart(item)">Part {{ item }}</button></div><div class="mt-6 rounded-2xl bg-paper p-4"><p class="text-xs font-bold">Mẹo của Đậu</p><p class="mt-2 text-xs leading-5 text-ink/55">Nghe lần đầu không nhìn chữ. Hãy ghi lại từ khoá và dự đoán ngữ cảnh trước khi xem transcript.</p></div></aside><section class="min-w-0 rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-8"><div class="flex items-center justify-between gap-3"><div class="min-w-0"><p class="text-xs font-extrabold text-ink/45">PART {{ lesson.part }} · {{ lesson.source === 'live' ? 'KHO ĐÃ PUBLISH' : 'BẢN MẪU' }}</p><h2 class="mt-1 text-xl font-extrabold tracking-[-0.04em]">{{ lesson.title }}</h2></div><span class="shrink-0 rounded-lg bg-leaf/15 px-2 py-1 text-[11px] font-bold text-leaf">Cấp {{ lesson.level }}</span></div><div class="mt-6 rounded-2xl bg-[#E9E9FF] p-5"><div class="flex items-center gap-4"><button class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-xl text-white shadow-soft transition hover:bg-iris focus-ring" :aria-label="playing ? 'Tạm dừng audio' : 'Phát audio'" @click="togglePlay">{{ playing ? 'Ⅱ' : '▶' }}</button><div class="min-w-0 flex-1"><div class="flex justify-between text-[11px] font-bold text-ink/50"><span>Audio TOEIC · {{ lesson.durationSec }} giây</span><span>{{ progress }}%</span></div><div class="mt-2 h-2 rounded-full bg-white/80"><div class="h-full rounded-full bg-iris transition-all" :style="{ width: `${progress}%` }" /></div></div></div><p v-if="lesson.source === 'fallback'" class="mt-4 text-xs leading-5 text-ink/55">Bài mẫu chưa kèm audio asset. Khi admin publish file audio vào content này, player sẽ dùng bản thu thật.</p></div><button class="mt-4 text-xs font-bold text-iris hover:underline focus-ring" @click="transcriptVisible = !transcriptVisible">{{ transcriptVisible ? 'Ẩn transcript' : 'Xem transcript' }}</button><p v-if="transcriptVisible" class="mt-3 rounded-xl bg-paper p-3 text-xs leading-6 text-ink/65">{{ lesson.transcript }}</p><div class="mt-6 border-t border-line pt-5"><label class="text-xs font-bold" for="listen-answer">{{ mode === 'dictation' ? 'Chép lại điều bạn nghe được' : 'Bạn chọn đáp án nào?' }}</label><textarea id="listen-answer" v-model="answer" rows="3" class="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-iris" placeholder="Viết câu trả lời của bạn..." /><div class="mt-3 flex flex-wrap items-center justify-between gap-3"><span v-if="checked" class="text-xs font-bold" :class="notice.startsWith('Đã lưu') ? 'text-leaf' : 'text-ink/60'">{{ notice || 'Đối chiếu transcript để tự kiểm tra, rồi nghe thêm một lần.' }}</span><span v-else /> <button class="rounded-xl bg-ink px-4 py-3 text-xs font-extrabold text-white transition hover:bg-iris disabled:opacity-40 focus-ring" :disabled="!answer.trim() || saving" @click="checkAnswer">{{ saving ? 'Đang lưu...' : 'Kiểm tra câu' }}</button></div></div></section></div>
  </div>
</template>
