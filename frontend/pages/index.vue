<script setup lang="ts">
type Goal = { key: string; label: string; target: number; achieved: number; unit: string; icon: string; tone: 'leaf' | 'iris' | 'bean' | 'ink' | 'pink'; to: string };
type Dashboard = {
  dayStart: string;
  metrics: { totalAttempts: number; correctAttempts: number; wrongAttempts: number; accuracy: number; studySecondsToday: number; xp: number; streakDays: number; dueVocabulary: number; writing: { grading: number; graded: number }; lastExam: { total: number; correct: number; score: number | null; createdAt: string } | null };
  goals: Goal[];
  recentActivity: Array<{ kind: string; surface: string; quantity: number; isCorrect?: boolean; correct?: number; occurredAt: string }>;
  nextAction: { surface: string; to: string; title: string; detail: string };
};

const { request, accessToken } = useAppApi();
const dashboard = ref<Dashboard | null>(null);
const loading = ref(false);
const notice = ref('');
const minutes = (seconds: number) => `${Math.floor(seconds / 60)} phút`;
const quickLinks = computed(() => [
  { label: 'Tiếp tục Listening', detail: dashboard.value ? `${minutes(dashboard.value.metrics.studySecondsToday)} hôm nay` : 'Đăng nhập để ghi thời lượng', to: '/listen', tone: 'leaf', icon: 'solar:headphones-round-sound-bold' },
  { label: 'Ôn Grammar', detail: dashboard.value ? `${dashboard.value.metrics.totalAttempts} câu đã làm` : 'Một câu có giải thích rõ', to: '/read?mode=grammar', tone: 'iris', icon: 'solar:book-2-bold' },
  { label: 'Học từ vựng', detail: dashboard.value?.metrics.dueVocabulary ? `${dashboard.value.metrics.dueVocabulary} thẻ đến hạn` : 'Mở hàng đợi SRS của bạn', to: '/vocabulary', tone: 'bean', icon: 'solar:book-bookmark-bold' },
  { label: 'Làm một mini test', detail: dashboard.value?.metrics.lastExam ? `Lần gần nhất: ${dashboard.value.metrics.lastExam.score ?? '—'} TOEIC` : 'Làm bài để có điểm đầu tiên', to: '/mock-test', tone: 'ink', icon: 'solar:clipboard-list-bold' }
]);

async function loadDashboard() {
  if (!accessToken.value) { notice.value = 'Đăng nhập để xem tiến độ và nhịp học của riêng bạn.'; return; }
  loading.value = true;
  try { dashboard.value = await request<Dashboard>('/learning/dashboard'); }
  catch { notice.value = 'Chưa đồng bộ được dashboard. Bạn vẫn có thể học và lưu hoạt động ở từng màn.'; }
  finally { loading.value = false; }
}

onMounted(loadDashboard);
</script>

<template>
  <div class="page-enter space-y-6">
    <StudyTrail :current="Math.min(dashboard?.goals.filter((goal) => goal.achieved >= goal.target).length ?? 0, 5)" :total="5" :label="dashboard ? `Streak ${dashboard.metrics.streakDays} ngày · ${dashboard.metrics.xp} XP đã ghi nhận` : 'Đăng nhập để theo dõi streak và XP đã ghi nhận'" />
    <p v-if="notice" class="rounded-xl bg-bean/20 p-3 text-xs font-bold text-[#8B6400]" role="status">{{ notice }}</p>
    <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MetricTile eyebrow="Độ chính xác" :value="dashboard ? `${dashboard.metrics.accuracy}%` : '—'" :caption="dashboard ? `${dashboard.metrics.correctAttempts}/${dashboard.metrics.totalAttempts} câu đúng` : 'Làm câu đầu tiên để bắt đầu'" tone="iris" /><MetricTile eyebrow="Điểm gần nhất" :value="dashboard?.metrics.lastExam?.score?.toString() ?? '—'" :caption="dashboard?.metrics.lastExam ? `${dashboard.metrics.lastExam.correct}/${dashboard.metrics.lastExam.total} câu đúng` : 'Nộp mini test để có điểm'" tone="leaf" /><MetricTile eyebrow="Đã học hôm nay" :value="dashboard ? minutes(dashboard.metrics.studySecondsToday) : '—'" :caption="dashboard ? `${dashboard.metrics.dueVocabulary} thẻ SRS đến hạn` : 'Đăng nhập để tính thời lượng'" tone="bean" /><MetricTile eyebrow="Chuỗi ngày" :value="dashboard ? `${dashboard.metrics.streakDays} ngày` : '—'" :caption="dashboard ? `${dashboard.metrics.writing.graded} feedback Writing đã chấm` : 'Hoạt động đã lưu tạo streak'" tone="plain" /></section>
    <div class="grid gap-6 lg:grid-cols-[1.35fr_.85fr]"><section class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6"><div class="flex items-end justify-between gap-4"><div><p class="text-xs font-bold text-ink/45">BẮT ĐẦU NHẸ</p><h2 class="mt-1 text-xl font-extrabold tracking-[-0.04em]">Chọn một nhịp học</h2></div><NuxtLink to="/listen" class="text-xs font-bold text-iris hover:underline focus-ring">Xem tất cả</NuxtLink></div><div class="mt-5 grid gap-3 sm:grid-cols-2"><NuxtLink v-for="link in quickLinks" :key="link.to" :to="link.to" class="group relative overflow-hidden rounded-2xl border border-line p-4 transition duration-300 hover:-translate-y-1 hover:border-iris/30 hover:shadow-soft focus-ring"><span :class="['mb-8 grid h-10 w-10 place-items-center rounded-xl', link.tone === 'leaf' ? 'bg-leaf/15 text-leaf' : link.tone === 'iris' ? 'bg-iris/10 text-iris' : link.tone === 'bean' ? 'bg-bean/20 text-[#A87400]' : 'bg-ink text-white']"><AppIcon :icon="link.icon" :size="22" /></span><span class="block text-sm font-extrabold">{{ link.label }}</span><span class="mt-1 block text-xs text-ink/45">{{ link.detail }}</span><span class="absolute bottom-4 right-4 text-ink/20 transition group-hover:translate-x-1 group-hover:text-iris"><AppIcon icon="solar:arrow-right-up-linear" :size="18" /></span></NuxtLink></div></section><GoalBoard :goals="dashboard?.goals ?? []" :loading="loading" /></div>
    <div class="grid gap-6 lg:grid-cols-2"><ActivityTimeline :activities="dashboard?.recentActivity ?? []" :next-action="dashboard?.nextAction" :loading="loading" /><section class="relative overflow-hidden rounded-[22px] bg-[#E9E9FF] p-6 shadow-soft"><div class="relative z-10 max-w-sm"><p class="text-xs font-bold text-iris/75">MẸO NHỎ CỦA ĐẬU</p><h2 class="mt-2 text-2xl font-extrabold leading-tight tracking-[-0.05em]">{{ dashboard?.nextAction?.title ?? 'Một phiên ngắn cũng đủ giữ nhịp.' }}</h2><p class="mt-3 text-sm leading-6 text-ink/60">{{ dashboard?.nextAction?.detail ?? 'Chọn một bài ngắn, hoàn thành nó, rồi để lịch sử học ghi nhận bước tiến đầu tiên.' }}</p><NuxtLink :to="dashboard?.nextAction?.to ?? '/listen?mode=dictation'" class="mt-6 inline-flex rounded-xl bg-ink px-4 py-3 text-xs font-bold text-white transition hover:bg-iris focus-ring">{{ dashboard?.nextAction ? 'Bắt đầu bước tiếp theo' : 'Luyện nghe chép' }}</NuxtLink></div><div class="absolute -bottom-20 -right-8 h-56 w-56 rounded-full border-[26px] border-white/70" aria-hidden="true" /><div class="absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-bean/70" aria-hidden="true" /></section></div>
  </div>
</template>
