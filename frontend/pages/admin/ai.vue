<script setup lang="ts">
import { activeProvider, chainWarning, fallbackCount, formatLatency, healthLabels, healthTones, normaliseBaseUrl, providerTone, type AiProbeAttempt, type AiProvider } from '~/utils/ai';
import { formatDateTime } from '~/utils/admin';

definePageMeta({ layout: 'admin' });

const { request } = useAppApi();
const { canAccess, ensureConsole } = useAdminConsole();
const toast = useToast();
const { confirm } = useConfirm();

const providers = ref<AiProvider[]>([]);
const encryptionReady = ref(true);
const loading = ref(false);
const saving = ref(false);
const testingId = ref('');
const editingId = ref('');

const blankForm = () => ({ name: '', baseUrl: '', model: '', apiKey: '', timeoutMs: 30000, maxRetries: 1 });
const form = ref(blankForm());

const chainHead = computed(() => activeProvider(providers.value));
const spares = computed(() => fallbackCount(providers.value));
const warning = computed(() => chainWarning(providers.value, encryptionReady.value));
const editing = computed(() => providers.value.find((provider) => provider.id === editingId.value) ?? null);
// A new provider always needs a key; an edit keeps the stored one unless the operator types a new one.
const canSubmit = computed(() => Boolean(form.value.name.trim() && form.value.baseUrl.trim() && form.value.model.trim() && (editingId.value || form.value.apiKey.trim())));

async function load() {
  if (!canAccess.value) return;
  loading.value = true;
  try {
    const result = await request<{ providers: AiProvider[]; encryptionReady: boolean }>('/admin/ai-providers');
    providers.value = result.providers;
    encryptionReady.value = result.encryptionReady;
  } catch { toast.error('Không tải được danh sách provider', 'Cần tài khoản admin để xem cấu hình AI.'); }
  finally { loading.value = false; }
}

function startCreate() {
  editingId.value = '';
  form.value = blankForm();
}

function startEdit(provider: AiProvider) {
  editingId.value = provider.id;
  form.value = { name: provider.name, baseUrl: provider.baseUrl, model: provider.model, apiKey: '', timeoutMs: provider.timeoutMs, maxRetries: provider.maxRetries };
}

async function submit() {
  if (!canSubmit.value || saving.value) return;
  saving.value = true;
  const body = {
    name: form.value.name.trim(),
    baseUrl: normaliseBaseUrl(form.value.baseUrl),
    model: form.value.model.trim(),
    timeoutMs: Number(form.value.timeoutMs),
    maxRetries: Number(form.value.maxRetries),
    ...(form.value.apiKey.trim() ? { apiKey: form.value.apiKey.trim() } : {})
  };
  try {
    if (editingId.value) {
      await request(`/admin/ai-providers/${editingId.value}`, { method: 'PATCH', body });
      toast.success('Đã cập nhật provider', form.value.apiKey.trim() ? 'Khoá mới đã được mã hoá và thay cho khoá cũ.' : 'Khoá cũ giữ nguyên vì bạn không nhập khoá mới.');
    } else {
      await request('/admin/ai-providers', { method: 'POST', body });
      toast.success('Đã thêm provider', 'Provider mới nằm cuối chuỗi dự phòng; kéo lên nếu muốn ưu tiên.');
    }
    startCreate();
    await load();
  } catch (error) {
    const code = (error as { data?: { code?: string } })?.data?.code;
    if (code === 'AI_ENCRYPTION_KEY_MISSING') toast.error('Server chưa cấu hình khoá mã hoá', 'Đặt AI_ENCRYPTION_KEY rồi khởi động lại API.');
    else toast.error('Chưa lưu được provider', 'Kiểm tra base URL, tên model và độ dài API key.');
  } finally { saving.value = false; }
}

async function toggle(provider: AiProvider) {
  try {
    await request(`/admin/ai-providers/${provider.id}`, { method: 'PATCH', body: { enabled: !provider.enabled } });
    await load();
  } catch { toast.error('Không đổi được trạng thái', 'Thử tải lại danh sách rồi thao tác lại.'); }
}

async function move(provider: AiProvider, direction: -1 | 1) {
  const order = providers.value.map((item) => item.id);
  const index = order.indexOf(provider.id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= order.length) return;
  [order[index], order[target]] = [order[target], order[index]];
  try {
    await request('/admin/ai-providers/order', { method: 'PATCH', body: { providerIds: order } });
    await load();
  } catch { toast.error('Không đổi được thứ tự', 'Danh sách có thể đã thay đổi ở nơi khác; hãy tải lại.'); }
}

async function test(provider: AiProvider) {
  testingId.value = provider.id;
  try {
    const { attempt } = await request<{ attempt: AiProbeAttempt }>(`/admin/ai-providers/${provider.id}/test`, { method: 'POST' });
    if (attempt.ok) toast.success(`${provider.name} trả lời được`, `Mất ${formatLatency(attempt.latencyMs)} cho một câu hỏi rất ngắn.`);
    else toast.error(`${provider.name} gọi không thành công`, attempt.error || `HTTP ${attempt.status ?? '—'}`);
    await load();
  } catch { toast.error('Không chạy được test', 'Provider có thể vừa bị xoá; hãy tải lại danh sách.'); }
  finally { testingId.value = ''; }
}

async function remove(provider: AiProvider) {
  await confirm({
    title: `Xoá ${provider.name}?`,
    description: 'Khoá đã lưu sẽ bị xoá hẳn và không khôi phục được. Nếu chỉ muốn tạm dừng, hãy tắt provider thay vì xoá.',
    confirmLabel: 'Xoá provider',
    tone: 'danger',
    icon: 'solar:trash-bin-trash-bold'
  }, async () => {
    try {
      await request(`/admin/ai-providers/${provider.id}`, { method: 'DELETE' });
      if (editingId.value === provider.id) startCreate();
      toast.success('Đã xoá provider', 'Các yêu cầu AI sẽ chuyển sang provider còn lại trong chuỗi.');
      await load();
    } catch { toast.error('Không xoá được provider', 'Thử tải lại danh sách rồi thao tác lại.'); }
  });
}

onMounted(async () => { await ensureConsole(); await load(); });
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      eyebrow="Hạ tầng AI dùng chung"
      title="AI providers"
      description="Mọi tính năng AI gọi qua một service duy nhất. Service thử provider theo thứ tự dưới đây và tự chuyển sang provider kế tiếp khi một provider lỗi."
    >
      <template #aside>
        <div class="flex gap-2">
          <span class="rounded-2xl bg-mint px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Đang dùng</span><span class="mt-0.5 block truncate text-sm font-black text-[#46A900]">{{ chainHead?.name ?? 'Chưa có' }}</span></span>
          <span class="rounded-2xl bg-azure px-4 py-3 text-center"><span class="block text-[11px] font-bold text-ink/50">Dự phòng</span><span class="mt-0.5 block text-lg font-black text-[#1288C8]">{{ spares }}</span></span>
        </div>
      </template>
    </AdminPageHeader>

    <p v-if="warning" class="flex items-start gap-3 rounded-[22px] border border-sun bg-sun/40 p-4 text-xs font-bold leading-5 text-[#8A6100]">
      <AppIcon icon="solar:danger-triangle-bold" :size="18" class="mt-px shrink-0" aria-hidden="true" />
      <span>{{ warning }}</span>
    </p>

    <div class="grid gap-5 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
      <section class="rounded-[22px] border border-line p-5 sm:p-7">
        <p class="text-xs font-extrabold text-ink/45">{{ editing ? 'SỬA PROVIDER' : 'THÊM PROVIDER' }}</p>
        <h2 class="mt-1 text-xl font-extrabold">{{ editing ? editing.name : 'Endpoint tương thích OpenAI' }}</h2>
        <p class="mt-2 text-xs leading-5 text-ink/55">API key được mã hoá trước khi lưu và không endpoint nào trả nó về. Sau khi lưu, bạn chỉ còn thấy 4 ký tự cuối.</p>

        <div class="mt-6 space-y-4">
          <AppInput v-model="form.name" label="Tên hiển thị" placeholder="OpenAI production" />
          <AppInput v-model="form.baseUrl" label="Base URL" placeholder="https://api.openai.com/v1" hint="Dán base URL trong tài liệu provider; phần /chat/completions sẽ tự bỏ." />
          <AppInput v-model="form.model" label="Tên model" placeholder="gpt-4o-mini" />
          <AppInput
            v-model="form.apiKey"
            type="password"
            label="API key"
            autocomplete="off"
            :placeholder="editing ? 'Để trống nếu giữ khoá hiện tại' : 'sk-…'"
            :hint="editing ? `Khoá đang lưu: ${editing.apiKeyLast4}` : 'Khoá chỉ đi từ trình duyệt tới server một lần duy nhất.'"
          />
          <div class="grid gap-3 sm:grid-cols-2">
            <AppSelect v-model="form.timeoutMs" label="Timeout" aria-label="Timeout mỗi lần gọi">
              <option :value="10000">10 giây</option>
              <option :value="30000">30 giây</option>
              <option :value="60000">60 giây</option>
              <option :value="120000">120 giây</option>
            </AppSelect>
            <AppSelect v-model="form.maxRetries" label="Thử lại" aria-label="Số lần thử lại trước khi chuyển provider">
              <option :value="0">Không thử lại</option>
              <option :value="1">1 lần</option>
              <option :value="2">2 lần</option>
              <option :value="3">3 lần</option>
            </AppSelect>
          </div>
          <p class="text-[11px] leading-5 text-ink/45">Thử lại chỉ áp dụng cho lỗi tạm thời như 429 hay 5xx. Sai khoá hoặc sai model thì chuyển provider ngay.</p>
        </div>

        <div class="mt-5 flex gap-2">
          <button class="cta-grass flex-1 px-4 py-3 text-xs font-extrabold disabled:opacity-40 focus-ring" :disabled="!canSubmit || saving" @click="submit">
            {{ saving ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm provider' }}
          </button>
          <button v-if="editing" class="rounded-xl border border-line px-4 py-3 text-xs font-extrabold hover:bg-mint focus-ring" @click="startCreate">Huỷ</button>
        </div>
      </section>

      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex items-end justify-between gap-3">
          <div>
            <p class="text-xs font-extrabold text-ink/45">CHUỖI DỰ PHÒNG</p>
            <h2 class="mt-1 text-xl font-extrabold">{{ providers.length }} provider</h2>
          </div>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="load">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>

        <ol class="mt-5 space-y-3">
          <li v-for="(provider, index) in providers" :key="provider.id" :class="['rounded-2xl p-4', providerTone(provider)]">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="flex items-center gap-2 text-sm font-extrabold">
                  <span class="grid size-6 shrink-0 place-items-center rounded-lg bg-white text-[11px] font-black text-ink/60">{{ index + 1 }}</span>
                  <span class="truncate" :class="provider.enabled ? '' : 'text-ink/45'">{{ provider.name }}</span>
                </p>
                <p class="mt-1.5 truncate text-[11px] text-ink/45">{{ provider.model }} · {{ provider.baseUrl }}</p>
                <p class="mt-1 text-[11px] text-ink/45">Khoá {{ provider.apiKeyLast4 }} · timeout {{ Math.round(provider.timeoutMs / 1000) }}s · thử lại {{ provider.maxRetries }}</p>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span :class="['rounded-lg px-2 py-1 text-[10px] font-extrabold', healthTones[provider.health]]">{{ healthLabels[provider.health] }}</span>
                <span :class="['rounded-lg px-2 py-1 text-[10px] font-extrabold', provider.enabled ? 'bg-iris/10 text-iris' : 'bg-white text-ink/50']">{{ provider.enabled ? 'Đang bật' : 'Đang tắt' }}</span>
              </div>
            </div>

            <p v-if="provider.lastCheckedAt" class="mt-3 text-[11px] leading-5 text-ink/45">
              Lần gọi gần nhất {{ formatDateTime(provider.lastCheckedAt) }} · {{ formatLatency(provider.lastLatencyMs) }}
              <span v-if="provider.lastError" class="mt-1 block break-words font-bold text-[#C1472F]">{{ provider.lastError }}</span>
            </p>

            <div class="mt-3 flex flex-wrap items-center gap-1 border-t border-white/70 pt-3">
              <button class="rounded-lg px-2 py-1 text-[11px] font-extrabold text-ink/60 hover:bg-white disabled:opacity-30 focus-ring" :disabled="index === 0" title="Ưu tiên cao hơn" @click="move(provider, -1)">↑</button>
              <button class="rounded-lg px-2 py-1 text-[11px] font-extrabold text-ink/60 hover:bg-white disabled:opacity-30 focus-ring" :disabled="index === providers.length - 1" title="Ưu tiên thấp hơn" @click="move(provider, 1)">↓</button>
              <span class="mx-1 h-4 w-px bg-white/80" aria-hidden="true"></span>
              <button class="rounded-lg px-2 py-1 text-[11px] font-extrabold text-iris hover:bg-white disabled:opacity-40 focus-ring" :disabled="testingId === provider.id" @click="test(provider)">{{ testingId === provider.id ? 'Đang gọi…' : 'Gọi thử' }}</button>
              <button class="rounded-lg px-2 py-1 text-[11px] font-extrabold text-ink/60 hover:bg-white focus-ring" @click="toggle(provider)">{{ provider.enabled ? 'Tắt' : 'Bật' }}</button>
              <button class="rounded-lg px-2 py-1 text-[11px] font-extrabold text-ink/60 hover:bg-white focus-ring" @click="startEdit(provider)">Sửa</button>
              <button class="ml-auto rounded-lg px-2 py-1 text-[11px] font-extrabold text-[#C1472F] hover:bg-white focus-ring" @click="remove(provider)">Xoá</button>
            </div>
          </li>
          <li v-if="loading && !providers.length" class="rounded-2xl bg-mint p-5 text-center text-xs text-ink/55">Đang tải danh sách provider…</li>
          <li v-else-if="!providers.length" class="rounded-2xl bg-mint p-5 text-center text-xs leading-5 text-ink/55">Chưa có provider nào. Thêm provider đầu tiên ở form bên cạnh — provider thứ hai sẽ tự trở thành dự phòng.</li>
        </ol>
      </section>
    </div>
  </div>
</template>
