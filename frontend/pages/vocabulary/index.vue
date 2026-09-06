<script setup lang="ts">
type VocabularySet = { id: string; slug: string; title: string; description: string | null; wordCount: number };
type DueCard = { entryId: string };

const { request, accessToken } = useAppApi();
const sets = ref<VocabularySet[]>([]);
const dueCount = ref<number | null>(null);
const loading = ref(true);
const failed = ref(false);

const totalWords = computed(() => sets.value.reduce((total, set) => total + set.wordCount, 0));

async function loadSets() {
  loading.value = true;
  try { sets.value = await request<VocabularySet[]>('/vocabulary/sets'); }
  catch { failed.value = true; }
  finally { loading.value = false; }
}

async function loadDue() {
  if (!accessToken.value) { dueCount.value = null; return; }
  try { dueCount.value = (await request<DueCard[]>('/vocabulary/review-queue', { query: { limit: 100 } })).length; }
  catch { dueCount.value = null; }
}

onMounted(async () => { await Promise.all([loadSets(), loadDue()]); });
</script>

<template>
  <div class="page-enter space-y-6">
    <section class="rounded-[26px] bg-sun p-6 sm:p-9">
      <p class="text-xs font-extrabold tracking-[0.18em] text-[#A87400]">VOCABULARY</p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Từ vựng có nhịp ôn.</h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-ink/60">Chọn một bộ từ để học, hoặc ôn những thẻ đã đến hạn theo lịch mà Ms Chole xếp cho bạn.</p>
        </div>
        <span class="rounded-xl bg-white/70 px-3 py-2 text-xs font-extrabold text-ink/60">{{ sets.length }} bộ · {{ totalWords }} từ</span>
      </div>
    </section>

    <NuxtLink to="/vocabulary/review" class="due-card focus-ring">
      <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-grass text-white"><AppIcon icon="solar:bolt-circle-bold" :size="24" /></span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-extrabold">Ôn thẻ đến hạn</span>
        <span class="mt-1 block text-xs leading-5 text-ink/60">
          <template v-if="dueCount === null">Đăng nhập để Ms Chole xếp lịch ôn theo trí nhớ của bạn.</template>
          <template v-else-if="dueCount === 0">Hôm nay không còn thẻ nào đến hạn. Học thêm một bộ mới bên dưới.</template>
          <template v-else>{{ dueCount }} thẻ đang chờ ôn — làm trước khi học từ mới sẽ nhớ lâu hơn.</template>
        </span>
      </span>
      <span class="due-action">Bắt đầu ôn <AppIcon icon="solar:arrow-right-linear" :size="16" /></span>
    </NuxtLink>

    <div class="grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex items-end justify-between gap-3">
          <div><p class="text-xs font-extrabold text-ink/45">BỘ TỪ VỰNG</p><h2 class="mt-1 text-xl font-extrabold">{{ sets.length }} bộ đã publish</h2></div>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadSets">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>

        <ul v-if="sets.length" class="mt-5 space-y-2.5">
          <li v-for="set in sets" :key="set.id">
            <NuxtLink :to="`/vocabulary/test/${set.slug}`" class="set-row focus-ring">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun text-[#A87400]"><AppIcon icon="solar:book-bookmark-bold" :size="20" /></span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-extrabold">{{ set.title }}</span>
                <span v-if="set.description" class="mt-1 block text-xs leading-5 text-ink/55">{{ set.description }}</span>
                <span class="mt-2 inline-flex rounded-lg bg-mint px-2 py-0.5 text-[11px] font-bold text-ink/55">{{ set.wordCount }} từ</span>
              </span>
              <span class="set-action">Học bộ này <AppIcon icon="solar:arrow-right-linear" :size="16" /></span>
            </NuxtLink>
          </li>
        </ul>

        <div v-else-if="loading" class="mt-5 rounded-2xl bg-mint p-6 text-sm text-ink/55">Đang tải danh sách bộ từ…</div>

        <div v-else class="mt-5 rounded-2xl bg-mint p-6">
          <p class="text-sm font-extrabold">{{ failed ? 'Chưa tải được danh sách bộ từ' : 'Chưa có bộ từ nào được publish' }}</p>
          <p class="mt-1.5 text-xs leading-5 text-ink/55">{{ failed ? 'Kiểm tra kết nối tới API rồi tải lại.' : 'Bộ từ xuất hiện ở đây khi được publish trong hệ thống nội dung.' }}</p>
        </div>
      </section>

      <aside class="space-y-4">
        <section class="rounded-[22px] bg-mint p-5 sm:p-6">
          <p class="text-xs font-extrabold text-[#46A900]">CÁCH MS CHOLE XẾP LỊCH</p>
          <ul class="mt-3 space-y-2 text-xs leading-5 text-ink/65">
            <li><span class="font-extrabold">Lại</span> — gặp lại ngay trong phiên này.</li>
            <li><span class="font-extrabold">Khó</span> — ôn lại sau vài giờ.</li>
            <li><span class="font-extrabold">Ổn</span> — ôn lại sau khoảng một ngày.</li>
            <li><span class="font-extrabold">Dễ</span> — giãn ra vài ngày.</li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.due-card, .set-row {
  display: flex;
  align-items: center;
  gap: .9rem;
  border: 1px solid var(--line);
  border-radius: 20px;
  corner-shape: squircle;
  padding: 1rem 1.15rem;
  transition: border-color .18s ease, background-color .18s ease, translate .18s ease;
}
.due-card:hover, .set-row:hover { border-color: rgba(88, 204, 2, .5); background: var(--mint); translate: 0 -2px; }
.set-row { align-items: flex-start; }

.due-action, .set-action {
  display: none;
  flex-shrink: 0;
  align-items: center;
  gap: .35rem;
  border-radius: 12px;
  background: var(--mint);
  padding: .5rem .75rem;
  font-size: .7rem;
  font-weight: 800;
  color: var(--grass-shade);
}
.set-action { align-self: center; }

@media (min-width: 640px) { .due-action, .set-action { display: inline-flex; } }
</style>
