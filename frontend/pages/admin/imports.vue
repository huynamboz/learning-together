<script setup lang="ts">
definePageMeta({ layout: 'admin' });

type ImportError = { rowNumber: number; field: string; message: string };
type ImportResult = { valid: boolean; errors?: ImportError[]; normalized?: unknown[] };

const { request } = useAppApi();
const { loadOverview, ensureConsole } = useAdminConsole();
const toast = useToast();

const importText = ref('[\n  { "externalKey": "listen-001", "type": "LISTENING", "title": "Office scene", "payload": { "transcript": "...", "durationSec": 20 } }\n]');
const result = ref<ImportResult | null>(null);
const running = ref(false);

const rowCount = computed(() => {
  try {
    const parsed: unknown = JSON.parse(importText.value);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch { return 0; }
});

async function runImport() {
  running.value = true;
  try {
    const rows: unknown = JSON.parse(importText.value);
    if (!Array.isArray(rows)) throw new Error('not-array');
    result.value = await request<ImportResult>('/admin/imports', { method: 'POST', body: { sourceName: 'admin-console.json', schema: 'content-v1', rows } });
    if (result.value.valid) { toast.success('Batch hợp lệ', `${result.value.normalized?.length ?? 0} row đã được normalize.`); await loadOverview(); }
    else toast.error('Batch có lỗi', `${result.value.errors?.length ?? 0} dòng cần sửa trước khi import.`);
  } catch {
    result.value = { valid: false, errors: [{ rowNumber: 0, field: 'json', message: 'JSON phải là một array hợp lệ.' }] };
    toast.error('Không đọc được batch', 'Nội dung phải là một JSON array.');
  } finally { running.value = false; }
}

onMounted(ensureConsole);
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      eyebrow="Nhập content theo batch"
      title="Import"
      description="Chuẩn hóa batch trước khi đưa vào kho. API trả lỗi theo từng dòng thay vì một thông báo thất bại chung."
    >
      <template #aside>
        <span class="rounded-2xl bg-mint px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Row trong batch</span><span class="mt-0.5 block text-lg font-black">{{ rowCount }}</span></span>
      </template>
    </AdminPageHeader>

    <div class="grid gap-5 lg:grid-cols-[1fr_.8fr] lg:items-start">
      <section class="rounded-[22px] border border-line p-5 sm:p-7">
        <p class="text-xs font-extrabold text-ink/45">BATCH IMPORT</p>
        <h2 class="mt-1 text-xl font-extrabold">Import content JSON</h2>
        <p class="mt-2 text-xs leading-5 text-ink/55">Mỗi row cần <span class="font-bold">externalKey</span>, <span class="font-bold">type</span>, <span class="font-bold">title</span> và <span class="font-bold">payload</span> dạng object. externalKey là khóa để upsert lần chạy sau.</p>
        <textarea v-model="importText" rows="16" class="mt-5 w-full rounded-2xl border border-line bg-mint px-4 py-3 font-mono text-xs leading-6 outline-none" aria-label="Import JSON" />
        <button class="cta-grass mt-4 px-5 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="running || !rowCount" @click="runImport">{{ running ? 'Đang xử lý…' : 'Validate & import' }}</button>
      </section>

      <section class="rounded-[22px] border border-line p-5 sm:p-7">
        <p class="text-xs font-extrabold text-ink/45">VALIDATION RESULT</p>
        <h2 class="mt-1 text-xl font-extrabold">Kết quả kiểm tra</h2>

        <div v-if="result" class="mt-5 rounded-2xl p-4" :class="result.valid ? 'bg-mint' : 'bg-blush'">
          <p class="text-sm font-extrabold">{{ result.valid ? 'Batch hợp lệ' : 'Batch có lỗi' }}</p>
          <p class="mt-2 text-xs text-ink/60">{{ result.normalized?.length ?? 0 }} row đã normalize · {{ result.errors?.length ?? 0 }} lỗi</p>
          <ul v-if="result.errors?.length" class="mt-4 space-y-2 text-xs text-[#B5473A]">
            <li v-for="error in result.errors" :key="`${error.rowNumber}-${error.field}`">Row {{ error.rowNumber }} · {{ error.field }}: {{ error.message }}</li>
          </ul>
        </div>
        <p v-else class="mt-5 rounded-2xl bg-mint p-4 text-xs leading-6 text-ink/55">Chưa có kết quả. Validate trước khi import để tránh batch lỗi đi vào kho content.</p>

        <p class="mt-5 border-t border-line pt-4 text-[11px] leading-5 text-ink/45">Rollback batch, review diff và publish theo từng item là các bước còn lại của import workflow trong docs; hiện console mới hỗ trợ validate và ghi batch.</p>
      </section>
    </div>
  </div>
</template>
