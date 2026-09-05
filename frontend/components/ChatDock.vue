<script setup lang="ts">
defineEmits<{ close: [] }>();
const chatTab = ref<'community' | 'friends'>('community');
const draft = ref('');
const composer = ref<HTMLTextAreaElement | null>(null);
const messages = [{ name: 'tran ngoc', text: 'cho mình hỏi kinh nghiệm muốn nghe tốt thì phải học như thế nào?' }, { name: 'Nguyễn Lê Bích Chi', text: 'nghe đoạn ngắn tầm 2-3p, chép đến khi nào không chép nổi nữa...' }];
const friends = ['Minh Anh', 'Phương Thảo'];

function reply(name: string) {
  draft.value = `@${name} `;
  nextTick(() => composer.value?.focus());
}

function send() {
  if (!draft.value.trim()) return;
  draft.value = '';
}
</script>

<template>
  <aside class="fixed bottom-4 right-4 z-50 flex h-[min(580px,calc(100vh-32px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-float" aria-label="Chat cộng đồng">
    <div class="flex items-center gap-3 bg-iris px-5 py-4 text-white"><span class="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-lg">⌁</span><div class="min-w-0 flex-1"><p class="text-sm font-extrabold">Chat cộng đồng</p><p class="text-[11px] text-white/70">● 49 đang online</p></div><button class="rounded-lg px-2 py-1 text-xl text-white/75 hover:bg-white/10 focus-ring" aria-label="Đóng chat" @click="$emit('close')">×</button></div>
    <div class="flex border-b border-line p-1"><button :class="['flex-1 rounded-lg px-3 py-2 text-xs focus-ring', chatTab === 'community' ? 'bg-paper font-bold' : 'font-semibold text-ink/45 hover:bg-paper']" @click="chatTab = 'community'">Cộng đồng</button><button :class="['flex-1 rounded-lg px-3 py-2 text-xs focus-ring', chatTab === 'friends' ? 'bg-paper font-bold' : 'font-semibold text-ink/45 hover:bg-paper']" @click="chatTab = 'friends'">Bạn bè</button></div>
    <div v-if="chatTab === 'community'" class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"><div v-for="message in messages" :key="message.name" class="flex gap-3"><span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">{{ message.name.slice(0, 1).toUpperCase() }}</span><div><p class="text-xs font-bold">{{ message.name }} <span class="ml-1 font-medium text-ink/35">8 ngày</span></p><p class="mt-1 text-xs leading-5 text-ink/70">{{ message.text }}</p><button class="mt-1 text-[11px] font-bold text-iris hover:underline focus-ring" @click="reply(message.name)">Trả lời</button></div></div></div>
    <div v-else class="min-h-0 flex-1 overflow-y-auto p-4"><p class="text-sm font-bold">Bạn bè</p><p class="mt-1 text-xs leading-5 text-ink/50">Danh sách bạn bè sẽ đồng bộ khi tài khoản được kết nối.</p><div class="mt-4 space-y-2"><div v-for="friend in friends" :key="friend" class="flex items-center gap-3 rounded-xl bg-paper px-3 py-2"><span class="grid h-8 w-8 place-items-center rounded-full bg-leaf/20 text-xs font-bold text-ink">{{ friend.slice(0, 1) }}</span><span class="text-xs font-semibold">{{ friend }}</span></div></div></div>
    <div class="border-t border-line p-3"><textarea ref="composer" v-model="draft" rows="2" class="w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-xs outline-none placeholder:text-ink/35 focus:border-iris" placeholder="Viết điều bạn muốn chia sẻ..." /><div class="mt-2 flex justify-between gap-2"><span class="self-center text-[11px] text-ink/40">{{ draft ? 'Sẵn sàng gửi' : 'Chọn Trả lời để bắt đầu' }}</span><button class="rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white transition hover:bg-iris disabled:cursor-not-allowed disabled:opacity-40" :disabled="!draft.trim()" @click="send">Gửi</button></div></div>
  </aside>
</template>
