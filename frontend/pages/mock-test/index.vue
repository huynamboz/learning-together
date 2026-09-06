<script setup lang="ts">
type CatalogTest = { id: string; slug: string; title: string; durationMin: number; questionCount: number };

const { request, accessToken } = useAppApi();
const tests = ref<CatalogTest[]>([]);
const loading = ref(true);
const failed = ref(false);

const totalQuestions = computed(() => tests.value.reduce((total, test) => total + test.questionCount, 0));

async function loadCatalog() {
  loading.value = true;
  try { tests.value = await request<CatalogTest[]>('/mock-tests'); }
  catch { failed.value = true; }
  finally { loading.value = false; }
}

onMounted(loadCatalog);
</script>

<template>
  <div class="page-enter space-y-6">
    <section class="rounded-[26px] bg-ink p-6 text-white sm:p-9">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-extrabold tracking-[0.18em] text-bean">MOCK TEST</p>
          <h1 class="mt-3 text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Một đề nhỏ, một bước tiến.</h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-white/65">Chọn một đề trong kho, làm ở chế độ luyện tập để xem đáp án ngay, hoặc thi thử để đo đúng nhịp thời gian.</p>
        </div>
        <div class="rounded-2xl bg-white/10 px-4 py-3 text-right">
          <p class="text-[11px] text-white/55">Đề · câu hỏi</p>
          <p class="mt-1 text-xl font-extrabold">{{ tests.length }} · {{ totalQuestions }}</p>
        </div>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-start">
      <section class="min-w-0 rounded-[22px] border border-line p-5 sm:p-6">
        <div class="flex items-end justify-between gap-3">
          <div><p class="text-xs font-extrabold text-ink/45">KHO ĐỀ</p><h2 class="mt-1 text-xl font-extrabold">{{ tests.length }} đề đã publish</h2></div>
          <button class="rounded-xl border border-line px-3 py-2 text-xs font-extrabold hover:bg-mint focus-ring" :disabled="loading" @click="loadCatalog">{{ loading ? 'Đang tải…' : 'Làm mới' }}</button>
        </div>

        <ul v-if="tests.length" class="mt-5 space-y-2.5">
          <li v-for="test in tests" :key="test.id" class="rounded-[18px] border border-line p-4 transition hover:border-iris/40 hover:bg-mint">
            <div class="flex items-start gap-3.5">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-azure text-[#1288C8]"><AppIcon icon="solar:clipboard-list-bold" :size="20" /></span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-extrabold">{{ test.title }}</p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <span class="rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold text-ink/55">{{ test.questionCount }} câu</span>
                  <span class="rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold text-ink/55">{{ test.durationMin }} phút</span>
                </div>
              </div>
            </div>
            <div class="mt-3.5 flex flex-wrap gap-2">
              <NuxtLink :to="`/mock-test/${test.id}/practice`" class="cta-grass inline-flex px-4 py-2.5 text-xs font-extrabold focus-ring">Luyện tập</NuxtLink>
              <NuxtLink :to="`/mock-test/${test.id}/exam`" class="cta-sky inline-flex px-4 py-2.5 text-xs font-extrabold focus-ring">Thi thử</NuxtLink>
            </div>
          </li>
        </ul>

        <div v-else-if="loading" class="mt-5 rounded-2xl bg-mint p-6 text-sm text-ink/55">Đang tải kho đề…</div>

        <div v-else class="mt-5 rounded-2xl bg-mint p-6">
          <p class="text-sm font-extrabold">{{ failed ? 'Chưa tải được kho đề' : 'Chưa có đề nào được publish' }}</p>
          <p class="mt-1.5 text-xs leading-5 text-ink/55">{{ failed ? 'Kiểm tra kết nối tới API rồi tải lại.' : 'Đề xuất hiện ở đây khi được publish trong hệ thống nội dung.' }}</p>
        </div>
      </section>

      <aside class="space-y-4">
        <section class="rounded-[22px] bg-mint p-5 sm:p-6">
          <p class="text-xs font-extrabold text-[#46A900]">HAI CHẾ ĐỘ</p>
          <p class="mt-3 text-xs leading-5 text-ink/65"><span class="font-extrabold">Luyện tập</span> — làm theo nhịp của bạn, tập trung vào việc hiểu vì sao sai.</p>
          <p class="mt-2 text-xs leading-5 text-ink/65"><span class="font-extrabold">Thi thử</span> — chạy đúng thời gian quy định để làm quen áp lực phòng thi.</p>
        </section>
        <section v-if="!accessToken" class="rounded-[22px] border border-line p-5 sm:p-6">
          <p class="text-xs font-extrabold text-ink/45">LƯU KẾT QUẢ</p>
          <p class="mt-2 text-xs leading-5 text-ink/55">Đăng nhập trước khi làm để điểm và câu sai được ghi vào hồ sơ học của bạn.</p>
          <NuxtLink to="/account" class="cta-sky mt-4 inline-flex px-4 py-2.5 text-xs font-extrabold focus-ring">Đăng nhập</NuxtLink>
        </section>
      </aside>
    </div>
  </div>
</template>
