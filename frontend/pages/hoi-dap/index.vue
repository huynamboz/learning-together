<script setup lang="ts">
type Author = { id: string; displayName: string; avatarAssetId?: string | null };
type CommunityComment = { id: string; content: string; createdAt: string; author: Author };
type CommunityPost = { id: string; content: string; tags: unknown; commentCount: number; createdAt: string; author: Author };
const { request, accessToken } = useAppApi();
const draft = ref(''); const posts = ref<CommunityPost[]>([]); const notice = ref(''); const loading = ref(false); const creating = ref(false); const expandedPostId = ref<string | null>(null); const commentsByPost = ref<Record<string, CommunityComment[]>>({}); const commentsLoading = ref<Record<string, boolean>>({}); const commentDraft = ref(''); const replying = ref(false);
const tagsOf = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const dateLabel = (value: string) => { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return 'vừa xong'; if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`; if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ`; return `${Math.floor(seconds / 86400)} ngày`; };

async function loadPosts() {
  if (!accessToken.value) { posts.value = []; return; }
  loading.value = true;
  try { posts.value = await request<CommunityPost[]>('/community/posts', { query: { limit: 20 } }); }
  catch { notice.value = 'Chưa tải được cộng đồng. Kiểm tra phiên đăng nhập rồi thử lại.'; }
  finally { loading.value = false; }
}
async function createPost() {
  if (!draft.value.trim() || creating.value) return;
  if (!accessToken.value) { notice.value = 'Đăng nhập để đăng câu hỏi và nhận phản hồi từ cộng đồng.'; return; }
  creating.value = true; notice.value = '';
  try { await request('/community/posts', { method: 'POST', body: { type: 'question', content: draft.value.trim(), tags: ['Learner'] } }); draft.value = ''; notice.value = 'Bài viết đã xuất hiện trong cộng đồng.'; await loadPosts(); }
  catch { notice.value = 'Chưa đăng được bài. Nội dung vẫn ở ô soạn để bạn thử lại.'; }
  finally { creating.value = false; }
}
async function toggleComments(post: CommunityPost) {
  expandedPostId.value = expandedPostId.value === post.id ? null : post.id;
  commentDraft.value = '';
  if (expandedPostId.value && !commentsByPost.value[post.id]) await loadComments(post.id);
}
async function loadComments(postId: string) {
  commentsLoading.value = { ...commentsLoading.value, [postId]: true };
  try { commentsByPost.value = { ...commentsByPost.value, [postId]: await request<CommunityComment[]>(`/community/posts/${postId}/comments`, { query: { limit: 50 } }) }; }
  catch { notice.value = 'Chưa tải được phần trả lời của bài viết này.'; }
  finally { commentsLoading.value = { ...commentsLoading.value, [postId]: false }; }
}
async function createComment(post: CommunityPost) {
  if (!commentDraft.value.trim() || replying.value) return;
  if (!accessToken.value) { notice.value = 'Đăng nhập để trả lời bài viết.'; return; }
  replying.value = true;
  try { await request(`/community/posts/${post.id}/comments`, { method: 'POST', body: { content: commentDraft.value.trim() } }); commentDraft.value = ''; post.commentCount += 1; await loadComments(post.id); }
  catch { notice.value = 'Chưa gửi được trả lời. Nội dung vẫn ở ô soạn để bạn thử lại.'; }
  finally { replying.value = false; }
}
onMounted(loadPosts);
</script>

<template>
  <div class="page-enter space-y-6">
    <section class="rounded-[26px] bg-azure p-6 shadow-soft sm:p-9"><p class="text-xs font-extrabold tracking-[0.18em] text-iris">CỘNG ĐỒNG</p><h1 class="mt-3 text-4xl font-extrabold tracking-[-0.06em] sm:text-5xl">Học cùng nhau vui hơn.</h1><p class="mt-3 max-w-xl text-sm leading-6 text-ink/60">Một câu hỏi tốt có thể rút ngắn cả tuần loay hoay. Chia sẻ cách học, xin feedback, và giữ nhịp cùng nhau.</p></section>
    <div class="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section class="min-w-0 space-y-3"><div class="rounded-[22px] border border-line bg-white p-4 shadow-soft"><label class="text-xs font-extrabold text-ink/45" for="post-body">BẠN ĐANG HỌC GÌ?</label><textarea id="post-body" v-model="draft" rows="3" class="mt-3 w-full resize-none rounded-xl border border-line bg-mint px-3 py-3 text-sm outline-none focus:border-iris" placeholder="Đặt câu hỏi hoặc chia sẻ một mẹo nhỏ..." /><div class="mt-2 flex items-center justify-between gap-3"><p class="text-xs text-ink/45">{{ accessToken ? 'Câu hỏi sẽ được đăng bằng tài khoản của bạn.' : 'Cần đăng nhập để đăng bài.' }}</p><AppButton :loading="creating" :disabled="!draft.trim()" @click="createPost">{{ creating ? 'Đang đăng...' : 'Đăng bài' }}</AppButton></div></div><p v-if="notice" class="rounded-xl bg-bean/20 p-3 text-xs font-bold text-[#8B6400]">{{ notice }}</p><div v-if="loading" class="rounded-[22px] border border-line bg-white p-6 text-sm text-ink/55">Đang tải bài viết...</div><article v-for="post in posts" :key="post.id" class="rounded-[22px] border border-line bg-white p-5 shadow-soft"><div class="flex items-center gap-3"><span class="grid h-10 w-10 place-items-center rounded-full bg-ink text-xs font-bold text-white">{{ post.author.displayName.slice(0, 1) }}</span><div><p class="text-sm font-extrabold">{{ post.author.displayName }}</p><p class="text-[11px] text-ink/40">{{ dateLabel(post.createdAt) }}</p></div></div><p class="mt-4 text-sm leading-7 text-ink/75">{{ post.content }}</p><div class="mt-4 flex flex-wrap items-center gap-2"><span v-for="tag in tagsOf(post.tags)" :key="tag" class="rounded-lg bg-iris/10 px-2 py-1 text-[11px] font-bold text-iris"># {{ tag }}</span><button class="ml-auto rounded-lg px-2 py-1 text-xs font-bold text-ink/45 hover:bg-mint focus-ring" @click="toggleComments(post)">{{ post.commentCount }} bình luận</button></div><div v-if="expandedPostId === post.id" class="mt-5 border-t border-line pt-4"><div v-if="commentsLoading[post.id]" class="text-xs text-ink/45">Đang tải trả lời...</div><ol v-else-if="commentsByPost[post.id]?.length" class="space-y-3"><li v-for="comment in commentsByPost[post.id]" :key="comment.id" class="rounded-xl bg-mint p-3"><p class="text-xs font-extrabold">{{ comment.author.displayName }} <span class="font-normal text-ink/40">· {{ dateLabel(comment.createdAt) }}</span></p><p class="mt-1 text-xs leading-5 text-ink/65">{{ comment.content }}</p></li></ol><p v-else class="text-xs text-ink/45">Chưa có trả lời. Hãy mở đầu cuộc trò chuyện.</p><div class="mt-4 flex gap-2"><input v-model="commentDraft" class="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-xs outline-none focus:border-iris" :aria-label="`Trả lời ${post.author.displayName}`" placeholder="Viết một câu trả lời hữu ích..." @keyup.enter="createComment(post)"><AppButton variant="accent" size="sm" :loading="replying" :disabled="!commentDraft.trim()" @click="createComment(post)">{{ replying ? 'Đang gửi...' : 'Trả lời' }}</AppButton></div></div></article><div v-if="!loading && !posts.length" class="rounded-[22px] border border-dashed border-line bg-white p-7 text-center"><p class="text-sm font-extrabold">Cộng đồng đang chờ câu hỏi đầu tiên của bạn.</p><p class="mt-2 text-xs leading-5 text-ink/55">Đăng nhập, nói rõ bạn đang vướng ở part nào và điều bạn đã thử.</p></div></section><aside class="h-fit rounded-[22px] border border-line bg-white p-5 shadow-soft"><p class="text-xs font-extrabold text-ink/45">GÓC NHỎ CHO BẠN</p><h2 class="mt-2 text-xl font-extrabold tracking-[-0.04em]">Ba cách hỏi dễ nhận được câu trả lời</h2><ol class="mt-5 space-y-4 text-sm leading-6 text-ink/65"><li><span class="mr-2 font-extrabold text-iris">01</span>Nói rõ Part hoặc dạng câu hỏi.</li><li><span class="mr-2 font-extrabold text-iris">02</span>Chia sẻ điều bạn đã thử.</li><li><span class="mr-2 font-extrabold text-iris">03</span>Chọn đúng tag để mọi người tìm thấy.</li></ol></aside></div>
  </div>
</template>
