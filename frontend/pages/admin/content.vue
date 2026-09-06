<script setup lang="ts">
definePageMeta({ layout: 'admin' });

type ContentRow = { id: string; type: string; title: string; slug: string; part?: number | null; level?: number | null; status: string; currentVersion: number; updatedAt: string };

const { request } = useAppApi();
const { canAccess, loadOverview, ensureConsole } = useAdminConsole();
const toast = useToast();

const rows = ref<ContentRow[]>([]);
const loading = ref(false);
const search = ref('');
const typeFilter = ref('ALL');
const statusFilter = ref('ALL');

const draftTitle = ref('');
const draftSlug = ref('');
const draftType = ref('LISTENING');
const draftPayload = ref('{\n  "transcript": "",\n  "durationSec": 20\n}');
const savingDraft = ref(false);
const publishingId = ref('');

const contentTypes = ['LISTENING', 'READING', 'GRAMMAR', 'VOCABULARY', 'EXAM', 'VIDEO', 'WRITING'];

const filteredRows = computed(() => rows.value.filter((row) =>
  (typeFilter.value === 'ALL' || row.type === typeFilter.value)
  && (statusFilter.value === 'ALL' || row.status === statusFilter.value)
  && (!search.value.trim() || `${row.title} ${row.slug}`.toLowerCase().includes(search.value.toLowerCase()))));

const publishedCount = computed(() => rows.value.filter((row) => row.status === 'PUBLISHED').length);
const draftCount = computed(() => rows.value.length - publishedCount.value);

async function loadContent() {
  if (!canAccess.value) return;
  loading.value = true;
  try { rows.value = await request<ContentRow[]>('/admin/content', { query: { page: 1, pageSize: 100 } }); }
  catch { toast.error('Không tải được kho content', 'Kiểm tra quyền content editor rồi thử lại.'); }
  finally { loading.value = false; }
}

async function createDraft() {
  if (!draftTitle.value.trim() || !draftSlug.value.trim()) return;
  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(draftPayload.value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not-object');
    payload = parsed as Record<string, unknown>;
  } catch { toast.error('Payload không hợp lệ', 'Nội dung phải là một JSON object.'); return; }
  savingDraft.value = true;
  try {
    const created = await request<ContentRow>('/admin/content', { method: 'POST', body: { type: draftType.value, title: draftTitle.value.trim(), slug: draftSlug.value.trim(), payload } });
    rows.value.unshift(created);
    draftTitle.value = '';
    draftSlug.value = '';
    toast.success('Đã tạo content draft', 'Gắn asset ở màn Media trước khi publish.');
    await loadOverview();
  } catch { toast.error('Chưa tạo được draft', 'Kiểm tra slug, payload và quyền của bạn.'); }
  finally { savingDraft.value = false; }
}

async function publish(row: ContentRow) {
  publishingId.value = row.id;
  try {
    await request(`/admin/content/${row.id}/publish`, { method: 'POST' });
    row.status = 'PUBLISHED';
    toast.success('Đã publish nội dung', `“${row.title}” đã hiển thị với người học.`);
    await loadOverview();
  } catch { toast.error('Publish thất bại', 'Hãy kiểm tra quyền hoặc dữ liệu bài học.'); }
  finally { publishingId.value = ''; }
}

onMounted(async () => { await ensureConsole(); await loadContent(); });
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      eyebrow="Kho bài học và publish"
      title="Content"
      description="Giữ kho bài học rõ ràng, có version và publish đúng lúc. Bản published là snapshot bất biến nên attempt cũ vẫn tái hiện được."
    >
      <template #aside>
        <div class="flex gap-2">
          <span class="rounded-2xl bg-mint px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Published</span><span class="mt-0.5 block text-lg font-black text-[#46A900]">{{ publishedCount }}</span></span>
          <span class="rounded-2xl bg-sun px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Draft</span><span class="mt-0.5 block text-lg font-black text-[#A87400]">{{ draftCount }}</span></span>
        </div>
      </template>
    </AdminPageHeader>

    <div class="grid gap-5 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div><p class="text-xs font-extrabold text-ink/45">CONTENT LIBRARY</p><h2 class="mt-1 text-xl font-extrabold">{{ filteredRows.length }} / {{ rows.length }} items</h2></div>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadContent">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>

        <div class="mt-5 flex flex-wrap items-start gap-2">
          <AppInput v-model="search" class="min-w-[180px] flex-1" placeholder="Tìm title hoặc slug…" aria-label="Tìm content" />
          <AppSelect v-model="typeFilter" class="w-full sm:w-auto" aria-label="Lọc loại content">
            <option value="ALL">Mọi loại</option>
            <option v-for="type in contentTypes" :key="type" :value="type">{{ type }}</option>
          </AppSelect>
          <AppSelect v-model="statusFilter" class="w-full sm:w-auto" aria-label="Lọc trạng thái">
            <option value="ALL">Mọi trạng thái</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </AppSelect>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[620px] text-left text-xs">
            <thead class="text-ink/40"><tr><th class="pb-3 pr-4 font-bold">Content</th><th class="pb-3 pr-4 font-bold">Type</th><th class="pb-3 pr-4 font-bold">Status</th><th class="pb-3 font-bold">Thao tác</th></tr></thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.id" class="border-t border-line">
                <td class="py-3 pr-4"><p class="font-extrabold">{{ row.title }}</p><p class="mt-1 text-ink/40">{{ row.slug }} · v{{ row.currentVersion }}</p></td>
                <td class="py-3 pr-4 font-bold text-iris">{{ row.type }}</td>
                <td class="py-3 pr-4"><span :class="['rounded-lg px-2 py-1 text-[10px] font-extrabold', row.status === 'PUBLISHED' ? 'bg-leaf/15 text-[#28896D]' : 'bg-sun text-[#A87400]']">{{ row.status }}</span></td>
                <td class="py-3">
                  <button v-if="row.status !== 'PUBLISHED'" class="rounded-lg px-2 py-1 font-bold text-iris hover:bg-iris/10 disabled:opacity-40 focus-ring" :disabled="publishingId === row.id" @click="publish(row)">{{ publishingId === row.id ? 'Đang publish…' : 'Publish' }}</button>
                  <span v-else class="text-ink/35">Live</span>
                </td>
              </tr>
              <tr v-if="loading && !rows.length"><td colspan="4" class="py-8 text-center text-ink/45">Đang tải kho content…</td></tr>
              <tr v-else-if="!loading && !rows.length"><td colspan="4" class="py-8 text-center text-ink/45">Chưa có content nào trong kho.</td></tr>
              <tr v-else-if="!filteredRows.length"><td colspan="4" class="py-8 text-center text-ink/45">Không có item nào khớp bộ lọc hiện tại.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-[22px] border border-line p-5 sm:p-6">
        <p class="text-xs font-extrabold text-ink/45">CREATE DRAFT</p>
        <h2 class="mt-1 text-xl font-extrabold">Thêm một bài mới</h2>
        <p class="mt-2 text-xs leading-5 text-ink/55">Tạo bài trước; gắn asset ở màn Media để có version playback thật.</p>
        <div class="mt-5 space-y-3">
          <AppInput v-model="draftTitle" placeholder="Title" aria-label="Title" />
          <AppInput v-model="draftSlug" placeholder="slug-noi-dung" aria-label="Slug" />
          <AppSelect v-model="draftType" class="w-full" aria-label="Loại content">
            <option v-for="type in contentTypes" :key="type" :value="type">{{ type }}</option>
          </AppSelect>
          <textarea v-model="draftPayload" rows="7" class="w-full rounded-2xl border border-line bg-mint px-4 py-3 font-mono text-xs outline-none" aria-label="Payload JSON" />
          <button class="cta-grass w-full px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="savingDraft || !draftTitle.trim() || !draftSlug.trim()" @click="createDraft">{{ savingDraft ? 'Đang tạo…' : 'Tạo draft' }}</button>
        </div>
      </section>
    </div>
  </div>
</template>
