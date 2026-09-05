# Product requirements và route map

## 1. Vai trò

| Vai trò | Quyền chính |
| --- | --- |
| Visitor | xem landing/blog/about/feedback, đăng nhập/đăng ký |
| Learner | học, lưu tiến độ, giỏ từ, ghi chú, thi thử, social, profile |
| Premium learner | toàn bộ learner + video/teacher support/benefit theo plan |
| Content editor | tạo/sửa/import/preview nội dung, quản lý media, submit review |
| Moderator | xử lý report, post/comment/user restriction |
| Admin | toàn quyền nội dung, user, billing, settings, audit, analytics |

## 2. Route contract học viên

| Route | Màn hình |
| --- | --- |
| `/` | dashboard |
| `/listen`, `/listen?mode=level`, `/listen?mode=dictation` | listening catalog |
| `/listening` | redirect legacy → `/listen?mode=type` |
| `/listen/:lessonId` | listening practice |
| `/read`, `/read?mode=grammar`, `/read?mode=bilingual` | reading catalog |
| `/grammar` | redirect legacy → `/read?part=grammar` |
| `/read/:lessonId` | reading/grammar practice |
| `/vocabulary` và `?tab=progress|my|algorithm` | vocabulary hub |
| `/vocabulary/test/:setId` | vocabulary set study |
| `/mock-test` và `?tab=progress` | mock catalog/progress |
| `/mock-test/:testId/practice` | practice runner |
| `/mock-test/:testId/exam` | timed exam runner |
| `/video`, `/video?lesson=:lessonId` | video learning |
| `/write`, `/write?part=2|3` | writing catalog |
| `/write/part1/:id`, `/write/part2/:id` | writing runner |
| `/hoi-dap` | community feed |
| `/leaderboard` | leaderboard |
| `/blog`, `/blog/:slug` | content blog |
| `/about`, `/feedback`, `/upgrade` | public/support/commerce |
| `/hub?tab=...` | account/referral hub |
| `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung` | legal |

## 3. Route admin

- `/admin`: KPI, health, pending work, recent activity.
- `/admin/content`: content search, filter, bulk action.
- `/admin/content/new`, `/admin/content/:id/edit`: editor theo loại.
- `/admin/imports`: import batches, validation errors, retry/rollback.
- `/admin/media`: media library, provider/status/usage.
- `/admin/users`, `/admin/users/:id`: account, entitlement, devices, audit.
- `/admin/community`: reports, moderation queue, banned words, appeals.
- `/admin/billing`: plans, orders, AI credits, refunds, affiliate withdrawals.
- `/admin/analytics`: learning, content quality, retention, storage and AI cost.
- `/admin/settings`: feature flags, quotas, notification templates, providers.

## 4. Cross-cutting UX requirements

- Mọi action async có optimistic state chỉ khi rollback an toàn; action destructive phải confirm và audit.
- Empty state luôn có lý do + CTA tiếp theo.
- Network error có retry; upload có progress, cancel, retry từng file.
- Không làm mất câu trả lời khi refresh/network drop; answer draft được lưu local và reconcile.
- Player/test có keyboard shortcut, focus rõ, không phụ thuộc màu để biểu đạt đúng/sai.
- Free/PRO/Premium phải hiển thị entitlement rõ ở thời điểm bị khóa, không che nội dung bằng modal vô nghĩa.
