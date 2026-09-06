# Phase 11 — Media and Writing review browser verification

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Contracts delivered

- `GET /media/:id/file` chỉ stream asset `READY` + `public`. Local storage đọc stream qua API; adapter S3/R2 có đường đọc object tương ứng, không trả credential cho learner.
- API media playback đặt MIME/length/disposition, cache ngắn và `Cross-Origin-Resource-Policy: cross-origin` riêng cho file delivery. Điều này cho native media element của app web cùng localhost nhưng khác port đọc được asset, trong khi policy mặc định của các endpoint khác giữ nguyên.
- Admin có media library, public/private action và attach action. Attach chỉ nhận `audio/*` cho Listening, `video/*` cho Video, tạo ContentVersion mới và audit event.
- Admin Writing queue có list `GRADING`, panel đọc bài, score 0–10 + feedback/rubric manual. Lưu review atomically đổi `GRADING → GRADED`, upsert grade và audit; không tạo AI feedback giả.
- Learner history render score và summary feedback từ `WritingGrade` của chính user.

## E2E evidence

### Real media

1. Tạo WAV 2 giây vô hại trong môi trường QA; upload theo upload-session local flow, final status `201`.
2. Chuyển asset `READY/private → public` (`200`), gắn vào `Part 1 · Office scene` (`200`), content version chuyển `v1 → v2`.
3. `GET /media/:id/file` trả `200`, `audio/wav`, `176478` bytes.
4. Browser Admin hiển thị asset `toeic-tone.wav`, `READY`, `public`, và control attach với danh sách Listening/Video rõ ràng.
5. Browser `/listen` render native audio controls. Sau khi play, accessibility tree đổi `play → pause` và session counter `00:00 → 00:01`, xác nhận playback thật chứ không còn timeline giả.

Trong lúc verify, browser đầu tiên báo “Unable to play media” vì Helmet mặc định đặt `Cross-Origin-Resource-Policy: same-origin` còn Nuxt/API chạy hai port. Đã khoanh vùng, thêm override chỉ trên public media response và thêm controller test. Lần load tiếp theo native audio play thành công.

### Writing review

1. Learner đăng nhập, gửi bài 36 từ trên `/write`; UI clear editor, báo còn credit và history có item `GRADING`.
2. Admin mở Writing review: queue có bài, mở panel hiển thị body/word count/author; nhập score `8.2` và feedback cụ thể.
3. Submit trả thông báo thành công, queue giảm `3 → 2`.
4. Learner đăng nhập lại `/write`: same item hiện `GRADED · 8.2/10` cùng feedback review đúng nội dung đã gửi.

## Responsive / intuitive QA

- Desktop accessibility review trên `/admin`, `/listen`, `/write`: action disabled trước khi đủ input; trạng thái private/public, pending/graded và lỗi playback không bị ngụy trang.
- Chrome device metrics `390 × 844` kiểm tra `/listen`, `/video`, `/write`, `/admin`.
- Tất cả route trả `visualViewport.width = 390`, `documentElement.scrollWidth = 390`, `body.scrollWidth = 390`; không có horizontal overflow.

## Automated checks

- Backend `npm run lint` — pass.
- Backend `npm run typecheck` — pass.
- Backend `npm test -- --runInBand` — pass, 22 suites / 48 tests.
- Backend `npm run build` — pass.
- Frontend `npm run typecheck` — pass.
- Frontend `npm test` — pass, 2 suites / 3 tests.
- Frontend `NUXT_IGNORE_LOCK=1 npm run build` — pass.

## Follow-up

- Local native streaming establishes the baseline; add HTTP range requests, CDN/public bucket policy, transcoding/waveforms and adaptive video before high-volume production media.
- Add a durable queue/worker + idempotency and an approved AI provider behind the existing WritingGrade transaction. Manual review remains a valid fallback.
- Media upload mime policy now validates string length correctly. Retain browser file-chooser automation coverage in a dedicated Playwright suite once it is introduced.
