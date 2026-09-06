<script setup lang="ts">
import type { CatalogItem } from '~/utils/catalog';
import { formatDuration, lessonMeta, toLessonSummary } from '~/utils/catalog';

const route = useRoute();
const config = useRuntimeConfig();
const { request, accessToken } = useAppApi();
const toast = useToast();

const slug = computed(() => String(route.params.slug));
const lesson = ref<ReturnType<typeof toLessonSummary> | null>(null);
const loading = ref(true);
const notFound = ref(false);

const mode = ref<'dictation' | 'type'>('dictation');
const playedSeconds = ref(0);
const transcript = ref('');
const transcriptVisible = ref(false);
const answer = ref('');
const checked = ref(false);
const saving = ref(false);

const mediaUrl = computed(() => lesson.value?.mediaAssetId ? `${config.public.apiBase}/media/${lesson.value.mediaAssetId}/file` : '');
const sessionClock = computed(() => `${String(Math.floor(playedSeconds.value / 60)).padStart(2, '0')}:${String(playedSeconds.value % 60).padStart(2, '0')}`);

async function loadLesson() {
  loading.value = true;
  try {
    const item = await request<CatalogItem>(`/content/${slug.value}`);
    lesson.value = toLessonSummary(item);
    transcript.value = typeof item.payload?.transcript === 'string' ? item.payload.transcript : '';
  } catch { notFound.value = true; }
  finally { loading.value = false; }
}

function syncAudioProgress(event: Event) {
  playedSeconds.value = Math.floor((event.target as HTMLAudioElement).currentTime);
}

async function checkAnswer() {
  checked.value = true;
  if (!accessToken.value) { toast.info('Chưa lưu tiến độ', 'Đăng nhập để thời lượng nghe được ghi vào hồ sơ của bạn.'); return; }
  if (playedSeconds.value < 1) { toast.info('Hãy nghe trước khi kiểm tra', 'Tiến độ chỉ được ghi khi bạn thực sự phát audio.'); return; }
  saving.value = true;
  try {
    await request('/learning/study-sessions', { method: 'POST', body: { surface: 'listening', durationSeconds: Math.max(1, playedSeconds.value) } });
    toast.success('Đã lưu thời lượng luyện nghe', `${sessionClock.value} đã được cộng vào tiến độ hôm nay.`);
  } catch { toast.error('Chưa đồng bộ được thời lượng', 'Bạn vẫn có thể đối chiếu transcript và thử lại sau.'); }
  finally { saving.value = false; }
}

onMounted(loadLesson);
</script>

<template>
  <div class="page-enter space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
      <div class="min-w-0">
        <NuxtLink to="/listen" class="inline-flex items-center gap-1.5 text-xs font-bold text-iris hover:underline focus-ring"><AppIcon icon="solar:arrow-left-linear" :size="15" /> Danh sách bài nghe</NuxtLink>
        <h1 class="mt-2 truncate text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">{{ lesson?.title ?? (loading ? 'Đang mở bài…' : 'Không tìm thấy bài') }}</h1>
        <div v-if="lesson && lessonMeta(lesson).length" class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="meta in lessonMeta(lesson)" :key="meta" class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ meta }}</span>
        </div>
      </div>
      <div class="rounded-2xl bg-mint px-4 py-3 text-right">
        <p class="text-[11px] font-bold text-ink/50">Đã nghe phiên này</p>
        <p class="mt-0.5 text-xl font-extrabold">{{ sessionClock }}</p>
      </div>
    </div>

    <div v-if="notFound" class="rounded-[22px] border border-line p-8">
      <p class="text-sm font-extrabold">Bài nghe này không còn được publish</p>
      <p class="mt-2 max-w-lg text-sm leading-6 text-ink/60">Có thể nó đã bị gỡ hoặc đổi slug. Quay lại danh sách để chọn một bài khác.</p>
      <NuxtLink to="/listen" class="cta-sky mt-5 inline-flex px-4 py-3 text-xs font-extrabold focus-ring">Về danh sách</NuxtLink>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[1.25fr_.75fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-7">
        <div class="flex flex-wrap gap-2" role="tablist" aria-label="Chế độ luyện nghe">
          <button v-for="item in [{ key: 'dictation', label: 'Nghe chép' }, { key: 'type', label: 'Nghe chọn đáp án' }]" :key="item.key" :class="['mode-tab focus-ring', mode === item.key ? 'is-active' : '']" role="tab" :aria-selected="mode === item.key" @click="mode = item.key as 'dictation' | 'type'">{{ item.label }}</button>
        </div>

        <div class="mt-6 rounded-2xl bg-azure p-5">
          <template v-if="mediaUrl">
            <audio :key="lesson?.id" class="w-full" controls preload="metadata" :src="mediaUrl" @timeupdate="syncAudioProgress" />
            <p class="mt-3 text-xs leading-5 text-ink/55">Audio phát từ asset đã publish{{ lesson?.durationSec ? ` · dài ${formatDuration(lesson.durationSec)}` : '' }}.</p>
          </template>
          <template v-else>
            <div class="flex items-center gap-4">
              <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-ink"><AppIcon icon="solar:headphones-round-sound-bold" :size="24" /></span>
              <div class="min-w-0">
                <p class="text-xs font-extrabold">Audio chưa sẵn sàng</p>
                <p class="mt-1 text-xs leading-5 text-ink/55">Admin cần upload, cho phép phát công khai rồi gắn file vào bài này. Bạn vẫn đọc được transcript bên dưới.</p>
              </div>
            </div>
          </template>
        </div>

        <button class="mt-4 text-xs font-bold text-iris hover:underline focus-ring" :disabled="!transcript" @click="transcriptVisible = !transcriptVisible">
          {{ transcript ? (transcriptVisible ? 'Ẩn transcript' : 'Xem transcript') : 'Bài này chưa có transcript' }}
        </button>
        <p v-if="transcriptVisible && transcript" class="mt-3 rounded-2xl bg-mint p-4 text-sm leading-7 text-ink/70">{{ transcript }}</p>

        <div class="mt-6 border-t border-line pt-5">
          <label class="text-xs font-extrabold" for="listen-answer">{{ mode === 'dictation' ? 'Chép lại điều bạn nghe được' : 'Bạn chọn đáp án nào?' }}</label>
          <textarea id="listen-answer" v-model="answer" rows="3" class="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none" placeholder="Viết câu trả lời của bạn…" />
          <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span class="text-xs text-ink/55">{{ checked ? 'Mở transcript để tự chấm, rồi nghe thêm một lượt.' : 'Nghe xong hãy tự chép lại trước khi mở transcript.' }}</span>
            <AppButton :loading="saving" :disabled="!answer.trim()" @click="checkAnswer">{{ saving ? 'Đang lưu…' : 'Kiểm tra câu' }}</AppButton>
          </div>
        </div>
      </section>

      <aside class="space-y-4">
        <section v-if="lesson?.summary" class="rounded-[22px] bg-mint p-5">
          <p class="text-xs font-extrabold text-[#46A900]">BÀI NÀY VỀ GÌ</p>
          <p class="mt-2 text-sm leading-6 text-ink/65">{{ lesson.summary }}</p>
        </section>
        <section v-if="lesson?.tags.length" class="rounded-[22px] border border-line p-5">
          <p class="text-xs font-extrabold text-ink/45">TỪ KHOÁ</p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span v-for="tag in lesson.tags" :key="tag" class="rounded-lg bg-mint px-2 py-1 text-[11px] font-bold text-ink/55">{{ tag }}</span>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.mode-tab {
  border-radius: 12px;
  border: 1px solid var(--line);
  padding: .6rem 1rem;
  font-size: .72rem;
  font-weight: 800;
  color: rgba(38, 50, 56, .6);
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.mode-tab:hover { background: var(--mint); }
.mode-tab.is-active { border-color: var(--iris); background: var(--iris); color: #fff; }
</style>
