<script setup lang="ts">
type ContentRow = { id: string; type: string; title: string; slug: string; part?: number | null; level?: number | null; status: string; currentVersion: number; updatedAt: string };
type MediaAsset = { id: string; originalName: string; mimeType: string; byteSize: number; status: string; visibility: 'public' | 'private'; createdAt: string; owner: { displayName: string; email: string } | null };
type WritingReview = { id: string; part: number; body: string; wordCount: number; status: string; submittedAt: string | null; createdAt: string; user: { displayName: string; email: string } };
type AdminUser = { id: string; email: string; displayName: string; status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'; createdAt: string; roles: string[]; plan: string };
type AuditEntry = { id: string; action: string; entity: string; entityId?: string | null; createdAt: string; actor?: { email: string; displayName: string } | null };
type OperationsOverview = { users: Record<string, number>; content: Record<string, number>; media: Record<string, number>; imports: Record<string, number>; writing: Record<string, number>; reports: Record<string, number>; orders: Record<string, number>; recentAudit: AuditEntry[] };
type AdminTab = 'content' | 'media' | 'writing' | 'users' | 'import' | 'audit';

const { request, accessToken } = useAppApi();
const tab = ref<AdminTab>('content');
const tabs: ReadonlyArray<{ key: AdminTab; label: string }> = [
  { key: 'content', label: 'Content' },
  { key: 'media', label: 'Media' },
  { key: 'writing', label: 'Writing review' },
  { key: 'users', label: 'Người dùng' },
  { key: 'import', label: 'Import' },
  { key: 'audit', label: 'Audit & health' }
];

const notice = ref('');
const rows = ref<ContentRow[]>([]);
const contentLoading = ref(false);
const search = ref('');
const typeFilter = ref('ALL');
const draftTitle = ref('');
const draftSlug = ref('');
const draftType = ref('LISTENING');
const draftPayload = ref('{\n  "transcript": "",\n  "durationSec": 20\n}');
const savingDraft = ref(false);

const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const uploadMessage = ref('');
const assets = ref<MediaAsset[]>([]);
const mediaLoading = ref(false);
const attaching = ref(false);
const selectedAssetId = ref('');
const selectedContentId = ref('');

const reviews = ref<WritingReview[]>([]);
const reviewsLoading = ref(false);
const selectedReviewId = ref('');
const gradeScore = ref<number | null>(null);
const gradeFeedback = ref('');
const grading = ref(false);

const overview = ref<OperationsOverview | null>(null);
const adminUsers = ref<AdminUser[]>([]);
const auditEntries = ref<AuditEntry[]>([]);
const userSearch = ref('');
const operationsLoading = ref(false);
const importText = ref('[\n  { "externalKey": "listen-001", "type": "LISTENING", "title": "Office scene", "payload": { "transcript": "...", "durationSec": 20 } }\n]');
const importResult = ref<{ valid: boolean; errors?: Array<{ rowNumber: number; field: string; message: string }>; normalized?: unknown[] } | null>(null);

const filteredRows = computed(() => rows.value.filter((row) => (typeFilter.value === 'ALL' || row.type === typeFilter.value) && (!search.value.trim() || `${row.title} ${row.slug}`.toLowerCase().includes(search.value.toLowerCase()))));
const attachableContent = computed(() => rows.value.filter((row) => row.type === 'LISTENING' || row.type === 'VIDEO'));
const publicReadyAssets = computed(() => assets.value.filter((asset) => asset.status === 'READY' && asset.visibility === 'public'));
const selectedReview = computed(() => reviews.value.find((review) => review.id === selectedReviewId.value) ?? null);
const activeUsers = computed(() => overview.value?.users.ACTIVE ?? adminUsers.value.filter((user) => user.status === 'ACTIVE').length);
const pendingReviews = computed(() => overview.value?.writing.GRADING ?? reviews.value.length);
const bytes = (value: number) => value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : 'Chưa gửi';

async function loadContent() {
  if (!accessToken.value) return;
  contentLoading.value = true;
  try { rows.value = await request<ContentRow[]>('/admin/content', { query: { page: 1, pageSize: 100 } }); }
  catch { notice.value = 'Không tải được content live. Kiểm tra quyền content editor.'; }
  finally { contentLoading.value = false; }
}

async function loadMedia() {
  if (!accessToken.value) return;
  mediaLoading.value = true;
  try { assets.value = await request<MediaAsset[]>('/admin/media', { query: { page: 1, pageSize: 100 } }); }
  catch { notice.value = 'Không tải được media library. Kiểm tra quyền admin/content editor.'; }
  finally { mediaLoading.value = false; }
}

async function loadReviews() {
  if (!accessToken.value) return;
  reviewsLoading.value = true;
  try { reviews.value = await request<WritingReview[]>('/admin/writing/submissions', { query: { status: 'GRADING', limit: 100 } }); }
  catch { notice.value = 'Không tải được hàng chờ Writing. Kiểm tra quyền moderator.'; }
  finally { reviewsLoading.value = false; }
}

async function loadOperations() {
  if (!accessToken.value) return;
  operationsLoading.value = true;
  try {
    const [nextOverview, users, audit] = await Promise.all([
      request<OperationsOverview>('/admin/overview'),
      request<AdminUser[]>('/admin/users', { query: { search: userSearch.value, limit: 100 } }),
      request<AuditEntry[]>('/admin/audit', { query: { limit: 24 } })
    ]);
    overview.value = nextOverview;
    adminUsers.value = users;
    auditEntries.value = audit;
  } catch { notice.value = 'Không tải được dữ liệu vận hành. Hãy đăng nhập bằng tài khoản admin.'; }
  finally { operationsLoading.value = false; }
}

onMounted(async () => { await Promise.all([loadContent(), loadMedia(), loadReviews(), loadOperations()]); });

async function createDraft() {
  if (!draftTitle.value.trim() || !draftSlug.value.trim()) return;
  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(draftPayload.value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not-object');
    payload = parsed as Record<string, unknown>;
  } catch { notice.value = 'Payload phải là một JSON object hợp lệ.'; return; }
  savingDraft.value = true;
  try {
    const created = await request<ContentRow>('/admin/content', { method: 'POST', body: { type: draftType.value, title: draftTitle.value.trim(), slug: draftSlug.value.trim(), payload } });
    rows.value.unshift(created);
    draftTitle.value = '';
    draftSlug.value = '';
    notice.value = 'Đã tạo content draft. Hãy gắn asset trước khi publish.';
  } catch { notice.value = 'Chưa tạo được draft. Kiểm tra slug, payload và quyền của bạn.'; }
  finally { savingDraft.value = false; }
}

async function publish(row: ContentRow) {
  try {
    await request(`/admin/content/${row.id}/publish`, { method: 'POST' });
    row.status = 'PUBLISHED';
    notice.value = `Đã publish “${row.title}”.`;
  } catch { notice.value = 'Publish thất bại. Hãy kiểm tra quyền hoặc dữ liệu bài học.'; }
}

function chooseFile(event: Event) { selectedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null; uploadMessage.value = ''; }

async function uploadFile() {
  if (!selectedFile.value || !accessToken.value) return;
  uploading.value = true;
  try {
    const file = selectedFile.value;
    const session = await request<{ sessionId: string; mode: 'direct' | 'server'; method: 'PUT' | 'POST'; url?: string; headers?: Record<string, string> }>('/media/upload-sessions', { method: 'POST', body: { originalName: file.name, mimeType: file.type, byteSize: file.size, purpose: 'admin-content' } });
    if (session.mode === 'direct' && session.url) await $fetch(session.url, { method: session.method, body: file, headers: session.headers });
    else {
      const form = new FormData();
      form.append('file', file);
      await request(`/media/upload-sessions/${session.sessionId}/file`, { method: 'POST', body: form });
    }
    if (session.mode === 'direct') await request(`/media/upload-sessions/${session.sessionId}/complete`, { method: 'POST' });
    uploadMessage.value = 'Upload hoàn tất. Chuyển asset sang công khai rồi gắn nó vào đúng bài học.';
    selectedFile.value = null;
    await loadMedia();
  } catch { uploadMessage.value = 'Upload thất bại. Kiểm tra MIME type, dung lượng và trạng thái storage.'; }
  finally { uploading.value = false; }
}

async function setVisibility(asset: MediaAsset, visibility: MediaAsset['visibility']) {
  try {
    const updated = await request<Pick<MediaAsset, 'id' | 'visibility' | 'status'>>(`/admin/media/${asset.id}/visibility`, { method: 'PATCH', body: { visibility } });
    assets.value = assets.value.map((item) => item.id === updated.id ? { ...item, visibility: updated.visibility } : item);
    notice.value = visibility === 'public' ? 'Asset đã sẵn sàng để phát công khai.' : 'Asset đã chuyển về private.';
  } catch { notice.value = 'Không đổi được visibility. Chỉ asset READY mới được phát công khai.'; }
}

async function attachAsset() {
  if (!selectedAssetId.value || !selectedContentId.value || attaching.value) return;
  attaching.value = true;
  try {
    const result = await request<{ id: string; currentVersion: number }>('/admin/content/' + selectedContentId.value + '/media', { method: 'PATCH', body: { assetId: selectedAssetId.value } });
    rows.value = rows.value.map((row) => row.id === result.id ? { ...row, currentVersion: result.currentVersion } : row);
    notice.value = 'Đã tạo version content mới và gắn asset. Learner có thể phát media ngay.';
  } catch { notice.value = 'Chưa gắn được asset. Listening cần audio, Video cần video và asset phải public.'; }
  finally { attaching.value = false; }
}

function openReview(review: WritingReview) {
  selectedReviewId.value = review.id;
  gradeScore.value = null;
  gradeFeedback.value = '';
}

async function submitGrade() {
  if (!selectedReview.value || gradeScore.value === null || !gradeFeedback.value.trim() || grading.value) return;
  grading.value = true;
  try {
    await request(`/admin/writing/submissions/${selectedReview.value.id}/grade`, {
      method: 'POST',
      body: {
        overall: gradeScore.value,
        rubric: { taskAchievement: gradeScore.value, languageControl: gradeScore.value },
        feedback: { summary: gradeFeedback.value.trim(), nextStep: 'Viết lại một câu với liên từ hoặc mệnh đề quan hệ.' }
      }
    });
    reviews.value = reviews.value.filter((review) => review.id !== selectedReviewId.value);
    selectedReviewId.value = '';
    gradeScore.value = null;
    gradeFeedback.value = '';
    notice.value = 'Đã lưu feedback manual. Learner có thể xem ngay trong lịch sử Writing.';
    await loadOperations();
  } catch { notice.value = 'Không thể lưu grade. Bài có thể đã được reviewer khác xử lý; hãy tải lại queue.'; }
  finally { grading.value = false; }
}

async function runImport() {
  try {
    const rowsToImport: unknown = JSON.parse(importText.value);
    if (!Array.isArray(rowsToImport)) throw new Error('not-array');
    importResult.value = await request('/admin/imports', { method: 'POST', body: { sourceName: 'admin-console.json', schema: 'content-v1', rows: rowsToImport } });
  } catch { importResult.value = { valid: false, errors: [{ rowNumber: 0, field: 'json', message: 'JSON phải là một array hợp lệ.' }] }; }
}

async function updateUserStatus(user: AdminUser, status: AdminUser['status']) {
  try {
    const updated = await request<Pick<AdminUser, 'id' | 'status'>>(`/admin/users/${user.id}/status`, { method: 'PATCH', body: { status } });
    adminUsers.value = adminUsers.value.map((item) => item.id === updated.id ? { ...item, status: updated.status } : item);
    notice.value = `Đã cập nhật trạng thái của ${user.displayName}.`;
  } catch { notice.value = 'Không cập nhật được trạng thái. Kiểm tra quyền hoặc thử lại.'; }
}
</script>

<template>
  <div class="page-enter space-y-6">
    <section class="rounded-[26px] bg-ink p-6 text-white shadow-float sm:p-9">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-0"><p class="text-xs font-extrabold tracking-[0.18em] text-bean">ADMIN CONSOLE</p><h1 class="mt-3 text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Vận hành rõ ràng.</h1><p class="mt-3 max-w-xl text-sm leading-6 text-white/65">Publish media thật, giữ phiên bản content và đưa feedback Writing về đúng người học.</p></div>
        <div class="rounded-2xl bg-white/10 px-4 py-3 text-right"><p class="text-[11px] text-white/55">Writing cần xem</p><p class="mt-1 text-xl font-extrabold text-bean">{{ pendingReviews }}</p></div>
      </div>
    </section>

    <div class="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1 shadow-soft" role="tablist" aria-label="Admin modules">
      <button v-for="item in tabs" :key="item.key" :class="['shrink-0 rounded-xl px-4 py-3 text-xs font-extrabold transition focus-ring', tab === item.key ? 'bg-ink text-white' : 'text-ink/55 hover:bg-paper']" @click="tab = item.key">{{ item.label }}</button>
    </div>
    <p v-if="notice" class="rounded-xl bg-bean/20 p-3 text-xs font-bold text-[#8B6400]" role="status">{{ notice }}</p>

    <section v-if="tab === 'content'" class="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
      <div class="min-w-0 rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6">
        <div class="flex flex-wrap items-end justify-between gap-3"><div><p class="text-xs font-extrabold text-ink/45">CONTENT LIBRARY</p><h2 class="mt-1 text-xl font-extrabold">{{ filteredRows.length }} items</h2></div><button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-paper focus-ring" :disabled="contentLoading" @click="loadContent">{{ contentLoading ? 'Đang tải...' : 'Làm mới' }}</button></div>
        <div class="mt-5 flex flex-wrap gap-2"><input v-model="search" class="min-w-[180px] flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-xs outline-none focus:border-iris" placeholder="Tìm title hoặc slug..." aria-label="Tìm content"><select v-model="typeFilter" class="rounded-xl border border-line bg-paper px-3 py-2.5 text-xs font-bold outline-none focus:border-iris" aria-label="Lọc loại content"><option>ALL</option><option>LISTENING</option><option>READING</option><option>GRAMMAR</option><option>VOCABULARY</option><option>EXAM</option><option>VIDEO</option><option>WRITING</option></select></div>
        <div class="mt-4 overflow-x-auto"><table class="w-full min-w-[620px] text-left text-xs"><thead class="text-ink/40"><tr><th class="pb-3 pr-4 font-bold">Content</th><th class="pb-3 pr-4 font-bold">Type</th><th class="pb-3 pr-4 font-bold">Status</th><th class="pb-3 font-bold">Action</th></tr></thead><tbody><tr v-for="row in filteredRows" :key="row.id" class="border-t border-line"><td class="py-3 pr-4"><p class="font-extrabold">{{ row.title }}</p><p class="mt-1 text-ink/40">{{ row.slug }} · v{{ row.currentVersion }}</p></td><td class="py-3 pr-4 font-bold text-iris">{{ row.type }}</td><td class="py-3 pr-4"><span :class="['rounded-lg px-2 py-1 text-[10px] font-extrabold', row.status === 'PUBLISHED' ? 'bg-leaf/15 text-[#28896D]' : 'bg-bean/20 text-[#A87400]']">{{ row.status }}</span></td><td class="py-3"><button v-if="row.status !== 'PUBLISHED'" class="rounded-lg px-2 py-1 font-bold text-iris hover:bg-iris/10 focus-ring" @click="publish(row)">Publish</button><span v-else class="text-ink/35">Live</span></td></tr><tr v-if="!contentLoading && !filteredRows.length"><td colspan="4" class="py-8 text-center text-ink/45">Chưa có content hoặc bạn chưa có quyền xem kho này.</td></tr></tbody></table></div>
      </div>
      <div class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6"><p class="text-xs font-extrabold text-ink/45">CREATE DRAFT</p><h2 class="mt-1 text-xl font-extrabold">Thêm một bài mới</h2><p class="mt-2 text-xs leading-5 text-ink/55">Tạo bài trước; gắn asset ở tab Media để có version playback thật.</p><div class="mt-5 space-y-3"><input v-model="draftTitle" class="w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-iris" placeholder="Title"><input v-model="draftSlug" class="w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-iris" placeholder="slug-noi-dung"><select v-model="draftType" class="w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-iris"><option>LISTENING</option><option>VIDEO</option><option>READING</option><option>GRAMMAR</option><option>VOCABULARY</option><option>EXAM</option><option>WRITING</option></select><textarea v-model="draftPayload" rows="7" class="w-full rounded-xl border border-line bg-paper px-3 py-3 font-mono text-xs outline-none focus:border-iris" aria-label="Payload JSON" /><button class="w-full rounded-xl bg-ink px-4 py-3 text-xs font-extrabold text-white transition hover:bg-iris disabled:opacity-40 focus-ring" :disabled="savingDraft || !draftTitle.trim() || !draftSlug.trim()" @click="createDraft">{{ savingDraft ? 'Đang tạo...' : 'Tạo draft' }}</button></div></div>
    </section>

    <section v-else-if="tab === 'media'" class="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
      <div class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-7"><p class="text-xs font-extrabold text-ink/45">MEDIA INGESTION</p><h2 class="mt-1 text-xl font-extrabold">Upload asset an toàn</h2><p class="mt-2 text-xs leading-5 text-ink/55">Asset mới luôn private. Chỉ chuyển public khi file đã sẵn sàng để learner phát.</p><label class="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-line bg-paper p-8 text-center hover:border-iris"><span class="text-iris"><AppIcon icon="solar:upload-minimalistic-bold" :size="32" /></span><span class="mt-3 text-sm font-extrabold">Chọn audio hoặc video</span><span class="mt-1 text-xs text-ink/45">Tối đa 500MB · MIME allowlist</span><input class="sr-only" type="file" accept="audio/mpeg,audio/wav,audio/ogg,video/mp4" @change="chooseFile"></label><p v-if="selectedFile" class="mt-4 rounded-xl bg-paper p-3 text-xs font-bold">{{ selectedFile.name }} · {{ bytes(selectedFile.size) }}</p><button class="mt-4 w-full rounded-xl bg-ink px-4 py-3 text-xs font-extrabold text-white transition hover:bg-iris disabled:opacity-40 focus-ring" :disabled="!selectedFile || uploading" @click="uploadFile">{{ uploading ? 'Đang upload...' : 'Upload asset' }}</button><p v-if="uploadMessage" class="mt-4 text-xs font-bold text-ink/60" role="status">{{ uploadMessage }}</p>
        <div class="mt-7 border-t border-line pt-5"><p class="text-xs font-extrabold text-ink/45">GẮN ASSET ĐÃ PUBLIC</p><p class="mt-2 text-xs leading-5 text-ink/55">Listening chỉ nhận audio; Video chỉ nhận file video. Thao tác tạo version content mới.</p><select v-model="selectedAssetId" class="mt-4 w-full rounded-xl border border-line bg-paper px-3 py-3 text-xs outline-none focus:border-iris" aria-label="Chọn asset công khai"><option value="">Chọn asset public...</option><option v-for="asset in publicReadyAssets" :key="asset.id" :value="asset.id">{{ asset.originalName }} · {{ asset.mimeType }}</option></select><select v-model="selectedContentId" class="mt-3 w-full rounded-xl border border-line bg-paper px-3 py-3 text-xs outline-none focus:border-iris" aria-label="Chọn content để gắn asset"><option value="">Chọn Listening hoặc Video...</option><option v-for="row in attachableContent" :key="row.id" :value="row.id">{{ row.type }} · {{ row.title }}</option></select><button class="mt-3 w-full rounded-xl bg-iris px-4 py-3 text-xs font-extrabold text-white transition hover:bg-ink disabled:opacity-40 focus-ring" :disabled="!selectedAssetId || !selectedContentId || attaching" @click="attachAsset">{{ attaching ? 'Đang gắn...' : 'Gắn vào content' }}</button></div>
      </div>
      <div class="min-w-0 rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6"><div class="flex items-end justify-between gap-3"><div><p class="text-xs font-extrabold text-ink/45">MEDIA LIBRARY</p><h2 class="mt-1 text-xl font-extrabold">Asset gần đây</h2></div><button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-paper focus-ring" :disabled="mediaLoading" @click="loadMedia">{{ mediaLoading ? 'Đang tải...' : 'Làm mới' }}</button></div><ol class="mt-5 space-y-3"><li v-for="asset in assets" :key="asset.id" class="rounded-2xl bg-paper p-4"><div class="flex flex-wrap items-start justify-between gap-3"><div class="min-w-0"><p class="truncate text-sm font-extrabold">{{ asset.originalName }}</p><p class="mt-1 text-[11px] text-ink/45">{{ asset.mimeType }} · {{ bytes(asset.byteSize) }} · {{ dateTime(asset.createdAt) }}</p></div><div class="flex shrink-0 items-center gap-2"><span :class="['rounded-lg px-2 py-1 text-[10px] font-extrabold', asset.status === 'READY' ? 'bg-leaf/15 text-[#28896D]' : 'bg-bean/20 text-[#A87400]']">{{ asset.status }}</span><span :class="['rounded-lg px-2 py-1 text-[10px] font-extrabold', asset.visibility === 'public' ? 'bg-iris/10 text-iris' : 'bg-white text-ink/50']">{{ asset.visibility }}</span></div></div><div class="mt-3 flex items-center justify-between gap-3"><p class="truncate text-[11px] text-ink/40">ID: {{ asset.id }}</p><button v-if="asset.status === 'READY'" class="rounded-lg px-2 py-1 text-[11px] font-extrabold text-iris hover:bg-white focus-ring" @click="setVisibility(asset, asset.visibility === 'public' ? 'private' : 'public')">{{ asset.visibility === 'public' ? 'Chuyển private' : 'Cho phép phát' }}</button></div></li><li v-if="!mediaLoading && !assets.length" class="rounded-2xl bg-paper p-5 text-center text-xs leading-5 text-ink/55">Chưa có asset hoặc bạn chưa có quyền xem media.</li></ol></div>
    </section>

    <section v-else-if="tab === 'writing'" class="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <div class="min-w-0 rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6"><div class="flex items-end justify-between gap-3"><div><p class="text-xs font-extrabold text-ink/45">GRADING QUEUE</p><h2 class="mt-1 text-xl font-extrabold">{{ reviews.length }} bài chờ review</h2></div><button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-paper focus-ring" :disabled="reviewsLoading" @click="loadReviews">{{ reviewsLoading ? 'Đang tải...' : 'Làm mới' }}</button></div><ol class="mt-5 space-y-3"><li v-for="review in reviews" :key="review.id"><button :class="['w-full rounded-2xl border p-4 text-left transition focus-ring', selectedReviewId === review.id ? 'border-iris bg-[#E8F7FF]' : 'border-line bg-paper hover:border-iris/40']" @click="openReview(review)"><div class="flex items-center justify-between gap-3"><p class="text-xs font-extrabold">{{ review.user.displayName }}</p><span class="rounded-lg bg-white px-2 py-1 text-[10px] font-extrabold text-iris">Part {{ review.part }}</span></div><p class="mt-2 line-clamp-2 text-xs leading-5 text-ink/60">{{ review.body }}</p><p class="mt-2 text-[11px] text-ink/40">{{ review.wordCount }} từ · {{ dateTime(review.submittedAt ?? review.createdAt) }}</p></button></li><li v-if="!reviewsLoading && !reviews.length" class="rounded-2xl bg-paper p-5 text-center text-xs leading-5 text-ink/55">Không còn bài nào trong hàng chờ.</li></ol></div>
      <div class="min-w-0 rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-7"><template v-if="selectedReview"><p class="text-xs font-extrabold text-ink/45">MANUAL REVIEW · PART {{ selectedReview.part }}</p><h2 class="mt-1 text-xl font-extrabold">{{ selectedReview.user.displayName }}</h2><p class="mt-1 text-xs text-ink/45">{{ selectedReview.wordCount }} từ · {{ selectedReview.user.email }}</p><blockquote class="mt-5 whitespace-pre-wrap rounded-2xl bg-paper p-4 text-sm leading-7 text-ink/75">{{ selectedReview.body }}</blockquote><label class="mt-6 block text-xs font-extrabold" for="writing-score">Điểm tổng / 10</label><input id="writing-score" v-model.number="gradeScore" class="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-iris" type="number" min="0" max="10" step="0.1" placeholder="Ví dụ: 7.5"><label class="mt-4 block text-xs font-extrabold" for="writing-feedback">Feedback gửi learner</label><textarea id="writing-feedback" v-model="gradeFeedback" rows="5" class="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-3 text-sm leading-6 outline-none focus:border-iris" placeholder="Nêu điểm tốt, lỗi cần sửa và một bước tiếp theo cụ thể..." /><button class="mt-4 w-full rounded-xl bg-ink px-4 py-3 text-xs font-extrabold text-white transition hover:bg-iris disabled:opacity-40 focus-ring" :disabled="gradeScore === null || !gradeFeedback.trim() || grading" @click="submitGrade">{{ grading ? 'Đang lưu feedback...' : 'Lưu review & gửi feedback' }}</button></template><div v-else class="grid min-h-80 place-items-center rounded-2xl bg-paper p-7 text-center"><div><p class="text-sm font-extrabold">Chọn một bài để review</p><p class="mt-2 max-w-sm text-xs leading-5 text-ink/55">Điểm và feedback chỉ được gửi sau khi bạn lưu; không có AI score hoặc nội dung được tạo giả.</p></div></div></div>
    </section>

    <section v-else-if="tab === 'users'" class="space-y-5"><div class="grid gap-4 sm:grid-cols-3"><div class="rounded-[22px] border border-line bg-white p-5 shadow-soft"><p class="text-xs font-extrabold text-ink/45">ACTIVE LEARNERS</p><p class="mt-3 text-3xl font-extrabold tracking-[-0.06em]">{{ activeUsers }}</p></div><div class="rounded-[22px] border border-line bg-white p-5 shadow-soft"><p class="text-xs font-extrabold text-ink/45">WRITING QUEUE</p><p class="mt-3 text-3xl font-extrabold tracking-[-0.06em]">{{ pendingReviews }}</p></div><div class="rounded-[22px] border border-line bg-white p-5 shadow-soft"><p class="text-xs font-extrabold text-ink/45">AUDIT EVENTS</p><p class="mt-3 text-3xl font-extrabold tracking-[-0.06em]">{{ overview?.recentAudit.length ?? 0 }}</p></div></div><div class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6"><div class="flex flex-wrap items-end justify-between gap-3"><div><p class="text-xs font-extrabold text-ink/45">ACCESS REVIEW</p><h2 class="mt-1 text-xl font-extrabold">Quyền và trạng thái người dùng</h2></div><button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-paper focus-ring" :disabled="operationsLoading" @click="loadOperations">{{ operationsLoading ? 'Đang tải...' : 'Làm mới' }}</button></div><div class="mt-5 flex flex-wrap gap-2"><input v-model="userSearch" class="min-w-[180px] flex-1 rounded-xl border border-line bg-paper px-3 py-2.5 text-xs outline-none focus:border-iris" placeholder="Tìm tên hoặc email..." aria-label="Tìm người dùng" @keyup.enter="loadOperations"><button class="rounded-xl bg-ink px-4 py-2.5 text-xs font-extrabold text-white hover:bg-iris focus-ring" @click="loadOperations">Tìm</button></div><div class="mt-4 overflow-x-auto"><table class="w-full min-w-[760px] text-left text-xs"><thead class="text-ink/40"><tr><th class="pb-3 pr-4 font-bold">Người dùng</th><th class="pb-3 pr-4 font-bold">Vai trò</th><th class="pb-3 pr-4 font-bold">Gói</th><th class="pb-3 pr-4 font-bold">Trạng thái</th><th class="pb-3 font-bold">Thao tác</th></tr></thead><tbody><tr v-for="user in adminUsers" :key="user.id" class="border-t border-line"><td class="py-3 pr-4"><p class="font-extrabold">{{ user.displayName }}</p><p class="mt-1 text-ink/40">{{ user.email }}</p></td><td class="py-3 pr-4"><span class="rounded-lg bg-iris/10 px-2 py-1 text-[10px] font-extrabold text-iris">{{ user.roles.join(' · ') || 'LEARNER' }}</span></td><td class="py-3 pr-4 font-bold">{{ user.plan }}</td><td class="py-3 pr-4"><span :class="['rounded-lg px-2 py-1 text-[10px] font-extrabold', user.status === 'ACTIVE' ? 'bg-leaf/15 text-[#28896D]' : 'bg-[#FFE6E2] text-[#B5473A]']">{{ user.status }}</span></td><td class="py-3"><button v-if="user.status === 'ACTIVE'" class="rounded-lg px-2 py-1 font-bold text-[#B5473A] hover:bg-[#FFE6E2] focus-ring" @click="updateUserStatus(user, 'SUSPENDED')">Tạm khóa</button><button v-else class="rounded-lg px-2 py-1 font-bold text-iris hover:bg-iris/10 focus-ring" @click="updateUserStatus(user, 'ACTIVE')">Kích hoạt</button></td></tr><tr v-if="!operationsLoading && !adminUsers.length"><td colspan="5" class="py-8 text-center text-ink/45">Chưa có dữ liệu hoặc bạn chưa có quyền admin.</td></tr></tbody></table></div></div></section>

    <section v-else-if="tab === 'import'" class="grid gap-5 lg:grid-cols-[1fr_.8fr]"><div class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-7"><p class="text-xs font-extrabold text-ink/45">BATCH IMPORT</p><h2 class="mt-1 text-xl font-extrabold">Import content JSON</h2><p class="mt-2 text-xs leading-5 text-ink/55">Mỗi row cần externalKey, type, title và payload object. API trả lỗi theo từng row.</p><textarea v-model="importText" rows="16" class="mt-5 w-full rounded-2xl border border-line bg-paper px-4 py-3 font-mono text-xs leading-6 outline-none focus:border-iris" aria-label="Import JSON" /><button class="mt-4 rounded-xl bg-ink px-5 py-3 text-xs font-extrabold text-white transition hover:bg-iris focus-ring" @click="runImport">Validate & import</button></div><div class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-7"><p class="text-xs font-extrabold text-ink/45">VALIDATION RESULT</p><div v-if="importResult" class="mt-5 rounded-2xl p-4" :class="importResult.valid ? 'bg-leaf/10' : 'bg-[#FFE6E2]'"><p class="text-sm font-extrabold">{{ importResult.valid ? 'Batch hợp lệ' : 'Batch có lỗi' }}</p><p class="mt-2 text-xs text-ink/60">{{ importResult.normalized?.length ?? 0 }} row đã normalize · {{ importResult.errors?.length ?? 0 }} lỗi</p><ul v-if="importResult.errors?.length" class="mt-4 space-y-2 text-xs text-[#B5473A]"><li v-for="error in importResult.errors" :key="`${error.rowNumber}-${error.field}`">Row {{ error.rowNumber }} · {{ error.field }}: {{ error.message }}</li></ul></div><div v-else class="mt-5 rounded-2xl bg-paper p-4 text-xs leading-6 text-ink/55">Chưa có kết quả. Validate trước khi import để tránh batch lỗi đi vào kho content.</div></div></section>

    <section v-else class="space-y-5"><div class="grid gap-5 md:grid-cols-3"><div v-for="item in [{ label: 'API health', value: 'Online', detail: 'NestJS · /api/v1/health', tone: 'text-leaf' }, { label: 'Content live', value: `${overview?.content.PUBLISHED ?? 0} published`, detail: `${overview?.content.DRAFT ?? 0} draft cần hoàn thiện`, tone: 'text-iris' }, { label: 'Storage', value: 'Configured', detail: `${overview?.media.READY ?? 0} asset ready · provider chọn server-side`, tone: 'text-[#A87400]' } ]" :key="item.label" class="rounded-[22px] border border-line bg-white p-5 shadow-soft"><p class="text-xs font-extrabold text-ink/45">{{ item.label }}</p><p :class="['mt-4 flex items-center gap-2 text-2xl font-extrabold', item.tone]"><AppIcon icon="solar:record-circle-bold" :size="18" />{{ item.value }}</p><p class="mt-2 text-xs leading-5 text-ink/50">{{ item.detail }}</p></div></div><div class="rounded-[22px] border border-line bg-white p-5 shadow-soft sm:p-6"><div class="flex flex-wrap items-end justify-between gap-3"><div><p class="text-xs font-extrabold text-ink/45">AUDIT TRAIL</p><h2 class="mt-1 text-xl font-extrabold">Sự kiện vận hành gần đây</h2></div><button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-paper focus-ring" :disabled="operationsLoading" @click="loadOperations">{{ operationsLoading ? 'Đang tải...' : 'Làm mới' }}</button></div><ol class="mt-5 divide-y divide-line"><li v-for="entry in auditEntries" :key="entry.id" class="flex flex-wrap items-center justify-between gap-2 py-3 text-xs"><div><p class="font-extrabold">{{ entry.action }} <span class="font-normal text-ink/45">· {{ entry.entity }}</span></p><p class="mt-1 text-ink/45">{{ entry.actor?.displayName || entry.actor?.email || 'System' }} · {{ dateTime(entry.createdAt) }}</p></div><span class="rounded-lg bg-paper px-2 py-1 font-bold text-ink/55">{{ entry.entityId ? entry.entityId.slice(0, 8) : 'SYSTEM' }}</span></li><li v-if="!operationsLoading && !auditEntries.length" class="py-8 text-center text-xs text-ink/45">Chưa có sự kiện audit hoặc bạn chưa có quyền admin.</li></ol></div></section>
  </div>
</template>

<style scoped>
@media (max-width: 639px) {
  .page-enter .grid > * { min-width: 0; }
}
</style>
