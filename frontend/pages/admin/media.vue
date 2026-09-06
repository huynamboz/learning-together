<script setup lang="ts">
import { formatBytes, formatDateTime } from '~/utils/admin';

definePageMeta({ layout: 'admin' });

type MediaAsset = { id: string; originalName: string; mimeType: string; byteSize: number; status: string; visibility: 'public' | 'private'; createdAt: string; owner: { displayName: string; email: string } | null };
type ContentRow = { id: string; type: string; title: string; status: string; currentVersion: number };
type UploadSession = { sessionId: string; mode: 'direct' | 'server'; method: 'PUT' | 'POST'; url?: string; headers?: Record<string, string> };

const { request } = useAppApi();
const { canAccess, loadOverview, ensureConsole } = useAdminConsole();
const toast = useToast();

const assets = ref<MediaAsset[]>([]);
const contentRows = ref<ContentRow[]>([]);
const loading = ref(false);
const selectedFile = ref<File | null>(null);
const uploading = ref(false);
const attaching = ref(false);
const selectedAssetId = ref('');
const selectedContentId = ref('');

const publicReadyAssets = computed(() => assets.value.filter((asset) => asset.status === 'READY' && asset.visibility === 'public'));
const attachableContent = computed(() => contentRows.value.filter((row) => row.type === 'LISTENING' || row.type === 'VIDEO'));
const readyCount = computed(() => assets.value.filter((asset) => asset.status === 'READY').length);

async function loadMedia() {
  if (!canAccess.value) return;
  loading.value = true;
  try { assets.value = await request<MediaAsset[]>('/admin/media', { query: { page: 1, pageSize: 100 } }); }
  catch { toast.error('Không tải được media library', 'Cần quyền admin hoặc content editor.'); }
  finally { loading.value = false; }
}

async function loadAttachTargets() {
  if (!canAccess.value) return;
  try { contentRows.value = await request<ContentRow[]>('/admin/content', { query: { page: 1, pageSize: 100 } }); }
  catch { contentRows.value = []; }
}

function chooseFile(event: Event) {
  selectedFile.value = (event.target as HTMLInputElement).files?.[0] ?? null;
}

async function uploadFile() {
  if (!selectedFile.value) return;
  uploading.value = true;
  try {
    const file = selectedFile.value;
    const session = await request<UploadSession>('/media/upload-sessions', { method: 'POST', body: { originalName: file.name, mimeType: file.type, byteSize: file.size, purpose: 'admin-content' } });
    if (session.mode === 'direct' && session.url) await $fetch(session.url, { method: session.method, body: file, headers: session.headers });
    else {
      const form = new FormData();
      form.append('file', file);
      await request(`/media/upload-sessions/${session.sessionId}/file`, { method: 'POST', body: form });
    }
    if (session.mode === 'direct') await request(`/media/upload-sessions/${session.sessionId}/complete`, { method: 'POST' });
    toast.success('Upload hoàn tất', 'Chuyển asset sang công khai rồi gắn nó vào đúng bài học.');
    selectedFile.value = null;
    await Promise.all([loadMedia(), loadOverview()]);
  } catch { toast.error('Upload thất bại', 'Kiểm tra MIME type, dung lượng và trạng thái storage.'); }
  finally { uploading.value = false; }
}

async function setVisibility(asset: MediaAsset, visibility: MediaAsset['visibility']) {
  try {
    const updated = await request<Pick<MediaAsset, 'id' | 'visibility' | 'status'>>(`/admin/media/${asset.id}/visibility`, { method: 'PATCH', body: { visibility } });
    assets.value = assets.value.map((item) => item.id === updated.id ? { ...item, visibility: updated.visibility } : item);
    toast.success(visibility === 'public' ? 'Asset đã công khai' : 'Asset đã chuyển về private', visibility === 'public' ? 'Learner có thể phát file này.' : 'File không còn phát được từ ngoài.');
  } catch { toast.error('Không đổi được visibility', 'Chỉ asset READY mới được phát công khai.'); }
}

async function attachAsset() {
  if (!selectedAssetId.value || !selectedContentId.value || attaching.value) return;
  attaching.value = true;
  try {
    const result = await request<{ id: string; currentVersion: number }>(`/admin/content/${selectedContentId.value}/media`, { method: 'PATCH', body: { assetId: selectedAssetId.value } });
    contentRows.value = contentRows.value.map((row) => row.id === result.id ? { ...row, currentVersion: result.currentVersion } : row);
    toast.success('Đã gắn asset vào bài học', `Content chuyển sang version v${result.currentVersion}; version cũ giữ nguyên.`);
  } catch { toast.error('Chưa gắn được asset', 'Listening cần audio, Video cần video và asset phải public.'); }
  finally { attaching.value = false; }
}

onMounted(async () => { await ensureConsole(); await Promise.all([loadMedia(), loadAttachTargets()]); });
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      eyebrow="Upload và asset library"
      title="Media"
      description="Kiểm tra asset trước khi đưa vào trải nghiệm học thật. Asset mới luôn private cho tới khi bạn chủ động cho phép phát."
    >
      <template #aside>
        <div class="flex gap-2">
          <span class="rounded-2xl bg-mint px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Ready</span><span class="mt-0.5 block text-lg font-black text-[#46A900]">{{ readyCount }}</span></span>
          <span class="rounded-2xl bg-azure px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Public</span><span class="mt-0.5 block text-lg font-black text-[#1288C8]">{{ publicReadyAssets.length }}</span></span>
        </div>
      </template>
    </AdminPageHeader>

    <div class="grid gap-5 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
      <section class="rounded-[22px] border border-line p-5 sm:p-7">
        <p class="text-xs font-extrabold text-ink/45">MEDIA INGESTION</p>
        <h2 class="mt-1 text-xl font-extrabold">Upload asset an toàn</h2>
        <p class="mt-2 text-xs leading-5 text-ink/55">Browser chỉ nhận upload session; credential storage không bao giờ rời server.</p>

        <label class="mt-6 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-line bg-mint p-8 text-center hover:border-iris">
          <span class="text-iris"><AppIcon icon="solar:upload-minimalistic-bold" :size="32" /></span>
          <span class="mt-3 text-sm font-extrabold">Chọn audio hoặc video</span>
          <span class="mt-1 text-xs text-ink/45">Tối đa 500MB · MIME allowlist</span>
          <input class="sr-only" type="file" accept="audio/mpeg,audio/wav,audio/ogg,video/mp4" @change="chooseFile">
        </label>
        <p v-if="selectedFile" class="mt-4 rounded-xl bg-mint p-3 text-xs font-bold">{{ selectedFile.name }} · {{ formatBytes(selectedFile.size) }}</p>
        <button class="cta-grass mt-4 w-full px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="!selectedFile || uploading" @click="uploadFile">{{ uploading ? 'Đang upload…' : 'Upload asset' }}</button>

        <div class="mt-7 border-t border-line pt-5">
          <p class="text-xs font-extrabold text-ink/45">GẮN ASSET ĐÃ PUBLIC</p>
          <p class="mt-2 text-xs leading-5 text-ink/55">Listening chỉ nhận audio; Video chỉ nhận file video. Thao tác tạo version content mới, không sửa version cũ.</p>
          <AppSelect v-model="selectedAssetId" class="mt-4 w-full text-xs" aria-label="Chọn asset công khai">
            <option value="">Chọn asset public…</option>
            <option v-for="asset in publicReadyAssets" :key="asset.id" :value="asset.id">{{ asset.originalName }} · {{ asset.mimeType }}</option>
          </AppSelect>
          <AppSelect v-model="selectedContentId" class="mt-3 w-full text-xs" aria-label="Chọn content để gắn asset">
            <option value="">Chọn Listening hoặc Video…</option>
            <option v-for="row in attachableContent" :key="row.id" :value="row.id">{{ row.type }} · {{ row.title }}</option>
          </AppSelect>
          <button class="cta-sky mt-3 w-full px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="!selectedAssetId || !selectedContentId || attaching" @click="attachAsset">{{ attaching ? 'Đang gắn…' : 'Gắn vào content' }}</button>
          <p v-if="!publicReadyAssets.length" class="mt-3 text-[11px] leading-5 text-ink/45">Chưa có asset public nào. Upload rồi bấm “Cho phép phát” ở danh sách bên cạnh.</p>
        </div>
      </section>

      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex items-end justify-between gap-3">
          <div><p class="text-xs font-extrabold text-ink/45">MEDIA LIBRARY</p><h2 class="mt-1 text-xl font-extrabold">{{ assets.length }} asset</h2></div>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadMedia">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>
        <ol class="mt-5 space-y-3">
          <li v-for="asset in assets" :key="asset.id" class="rounded-2xl bg-mint p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-sm font-extrabold">{{ asset.originalName }}</p>
                <p class="mt-1 text-[11px] text-ink/45">{{ asset.mimeType }} · {{ formatBytes(asset.byteSize) }} · {{ formatDateTime(asset.createdAt) }}</p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span :class="['rounded-lg px-2 py-1 text-[10px] font-extrabold', asset.status === 'READY' ? 'bg-leaf/15 text-[#28896D]' : 'bg-sun text-[#A87400]']">{{ asset.status }}</span>
                <span :class="['rounded-lg px-2 py-1 text-[10px] font-extrabold', asset.visibility === 'public' ? 'bg-iris/10 text-iris' : 'bg-white text-ink/50']">{{ asset.visibility }}</span>
              </div>
            </div>
            <div class="mt-3 flex items-center justify-between gap-3">
              <p class="truncate text-[11px] text-ink/40">ID: {{ asset.id }}</p>
              <button v-if="asset.status === 'READY'" class="rounded-lg px-2 py-1 text-[11px] font-extrabold text-iris hover:bg-white focus-ring" @click="setVisibility(asset, asset.visibility === 'public' ? 'private' : 'public')">{{ asset.visibility === 'public' ? 'Chuyển private' : 'Cho phép phát' }}</button>
            </div>
          </li>
          <li v-if="loading && !assets.length" class="rounded-2xl bg-mint p-5 text-center text-xs text-ink/55">Đang tải media library…</li>
          <li v-else-if="!assets.length" class="rounded-2xl bg-mint p-5 text-center text-xs leading-5 text-ink/55">Chưa có asset nào. File đầu tiên bạn upload sẽ xuất hiện ở đây.</li>
        </ol>
      </section>
    </div>
  </div>
</template>
