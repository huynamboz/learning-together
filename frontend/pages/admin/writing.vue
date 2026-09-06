<script setup lang="ts">
import { formatDateTime } from '~/utils/admin';

definePageMeta({ layout: 'admin' });

type WritingReview = { id: string; part: number; body: string; wordCount: number; status: string; submittedAt: string | null; createdAt: string; user: { displayName: string; email: string } };

const { request } = useAppApi();
const { canAccess, loadOverview, ensureConsole } = useAdminConsole();
const toast = useToast();

const reviews = ref<WritingReview[]>([]);
const loading = ref(false);
const selectedId = ref('');
const gradeScore = ref<number | null>(null);
const gradeFeedback = ref('');
const grading = ref(false);

const selected = computed(() => reviews.value.find((review) => review.id === selectedId.value) ?? null);
const scoreValid = computed(() => gradeScore.value !== null && gradeScore.value >= 0 && gradeScore.value <= 10);

async function loadReviews() {
  if (!canAccess.value) return;
  loading.value = true;
  try { reviews.value = await request<WritingReview[]>('/admin/writing/submissions', { query: { status: 'GRADING', limit: 100 } }); }
  catch { toast.error('Không tải được hàng chờ Writing', 'Cần quyền admin hoặc moderator.'); }
  finally { loading.value = false; }
}

function openReview(review: WritingReview) {
  selectedId.value = review.id;
  gradeScore.value = null;
  gradeFeedback.value = '';
}

async function submitGrade() {
  if (!selected.value || !scoreValid.value || !gradeFeedback.value.trim() || grading.value) return;
  grading.value = true;
  try {
    await request(`/admin/writing/submissions/${selected.value.id}/grade`, {
      method: 'POST',
      body: {
        overall: gradeScore.value,
        rubric: { taskAchievement: gradeScore.value, languageControl: gradeScore.value },
        feedback: { summary: gradeFeedback.value.trim(), nextStep: 'Viết lại một câu với liên từ hoặc mệnh đề quan hệ.' }
      }
    });
    reviews.value = reviews.value.filter((review) => review.id !== selectedId.value);
    selectedId.value = '';
    gradeScore.value = null;
    gradeFeedback.value = '';
    toast.success('Đã gửi feedback', 'Learner thấy điểm và nhận xét ngay trong lịch sử Writing.');
    await loadOverview();
  } catch { toast.error('Không lưu được review', 'Bài có thể đã được reviewer khác xử lý; hãy tải lại queue.'); }
  finally { grading.value = false; }
}

onMounted(async () => { await ensureConsole(); await loadReviews(); });
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      eyebrow="Chấm bài đang chờ"
      title="Writing review"
      description="Review thủ công để feedback đến đúng người học. Điểm và nhận xét chỉ được gửi sau khi bạn lưu; không có score do AI tạo sẵn."
    >
      <template #aside>
        <span class="rounded-2xl bg-sun px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Đang chờ</span><span class="mt-0.5 block text-lg font-black text-[#A87400]">{{ reviews.length }}</span></span>
      </template>
    </AdminPageHeader>

    <div class="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex items-end justify-between gap-3">
          <div><p class="text-xs font-extrabold text-ink/45">GRADING QUEUE</p><h2 class="mt-1 text-xl font-extrabold">{{ reviews.length }} bài chờ review</h2></div>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadReviews">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>
        <ol class="mt-5 space-y-3">
          <li v-for="review in reviews" :key="review.id">
            <button :class="['w-full rounded-2xl border p-4 text-left transition focus-ring', selectedId === review.id ? 'border-iris bg-azure' : 'border-line bg-mint hover:border-iris/40']" @click="openReview(review)">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-extrabold">{{ review.user.displayName }}</p>
                <span class="rounded-lg bg-white px-2 py-1 text-[10px] font-extrabold text-iris">Part {{ review.part }}</span>
              </div>
              <p class="mt-2 line-clamp-2 text-xs leading-5 text-ink/60">{{ review.body }}</p>
              <p class="mt-2 text-[11px] text-ink/40">{{ review.wordCount }} từ · {{ formatDateTime(review.submittedAt ?? review.createdAt) }}</p>
            </button>
          </li>
          <li v-if="loading && !reviews.length" class="rounded-2xl bg-mint p-5 text-center text-xs text-ink/55">Đang tải hàng chờ…</li>
          <li v-else-if="!reviews.length" class="rounded-2xl bg-mint p-5 text-center text-xs leading-5 text-ink/55">Không còn bài nào trong hàng chờ.</li>
        </ol>
      </section>

      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-7">
        <template v-if="selected">
          <p class="text-xs font-extrabold text-ink/45">MANUAL REVIEW · PART {{ selected.part }}</p>
          <h2 class="mt-1 text-xl font-extrabold">{{ selected.user.displayName }}</h2>
          <p class="mt-1 text-xs text-ink/45">{{ selected.wordCount }} từ · {{ selected.user.email }}</p>
          <blockquote class="mt-5 whitespace-pre-wrap rounded-2xl bg-mint p-4 text-sm leading-7 text-ink/75">{{ selected.body }}</blockquote>

          <label class="mt-6 block text-xs font-extrabold" for="writing-score">Điểm tổng / 10</label>
          <AppInput id="writing-score" v-model.number="gradeScore" type="number" min="0" max="10" step="0.1" placeholder="Ví dụ: 7.5" />
          <p v-if="gradeScore !== null && !scoreValid" class="mt-1.5 text-xs font-bold text-[#B5473A]">Điểm phải nằm trong khoảng 0–10.</p>

          <label class="mt-4 block text-xs font-extrabold" for="writing-feedback">Feedback gửi learner</label>
          <textarea id="writing-feedback" v-model="gradeFeedback" rows="5" class="mt-2 w-full rounded-2xl border border-line bg-mint px-4 py-3 text-sm leading-6 outline-none" placeholder="Nêu điểm tốt, lỗi cần sửa và một bước tiếp theo cụ thể…" />
          <button class="cta-grass mt-4 w-full px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="!scoreValid || !gradeFeedback.trim() || grading" @click="submitGrade">{{ grading ? 'Đang lưu feedback…' : 'Lưu review & gửi feedback' }}</button>
        </template>

        <div v-else class="grid min-h-80 place-items-center rounded-2xl bg-mint p-7 text-center">
          <div>
            <p class="text-sm font-extrabold">Chọn một bài để review</p>
            <p class="mt-2 max-w-sm text-xs leading-5 text-ink/55">Mỗi lần lưu sẽ đổi trạng thái bài từ GRADING sang GRADED trong một transaction và ghi lại audit event.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
