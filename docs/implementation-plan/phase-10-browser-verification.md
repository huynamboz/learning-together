# Phase 10 — Content and engagement browser verification

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Implemented contracts

- `POST /learning/study-sessions` ghi một study session đã hoàn tất với surface allowlist và duration 1–86,400 giây.
- Community feed batch-resolve display name/avatar theo `authorId`; có thêm `GET /community/posts/:id/comments` và UI reply flow.
- `GET /writing/submissions` chỉ trả history của user đang đăng nhập, tối đa 20 item theo thứ tự mới nhất.
- Listening và Video lấy content `PUBLISHED` qua catalog API. Fallback chỉ hiển thị khi catalog/network không sẵn sàng và được gắn nhãn rõ.

## Browser E2E — desktop

- Listening tải `Part 1 · Office scene` từ content publish, player progression tăng theo thời lượng, transcript mở/đóng, và một lần xác nhận sau khi nghe đã trả trạng thái “Đã lưu thời lượng luyện nghe vào tiến độ của bạn.”
- Video tải `Nối âm trong câu hỏi ngắn` từ catalog publish, render đúng category/duration/summary và nút play/pause phản hồi.
- Community tải post seed với tên author thật; tạo post mới, mở reply row, gửi comment; post hiển thị author, count chuyển `0 → 1`, và comment mới xuất hiện ngay trong thread.
- Writing gửi một bài bằng API, clear editor, trả credit còn lại, và history reload hiển thị item `GRADING` với word count.

## Responsive / intuitive QA

- Chrome Device Metrics đã kiểm tra bốn route `/listen`, `/video`, `/hoi-dap`, `/write` tại `390 × 844`.
- Mỗi route trả `visualViewport.width = 390`, `documentElement.scrollWidth = 390`, `body.scrollWidth = 390`.
- Composer, reply row, playlist và lịch sử writing giữ trong chiều rộng màn hình; layout desktop mới chỉ chia hai cột từ breakpoint `lg`.
- Không có trạng thái sync giả: success text chỉ xuất hiện sau mutation thành công; lỗi giữ nội dung người dùng đã nhập để gửi lại.

## Automated checks

- Backend `npm run lint` — pass.
- Backend `npm run typecheck` — pass.
- Backend `npm test -- --runInBand` — pass, 18 suites / 34 tests.
- Backend `npm run build` — pass.
- Frontend `npm run typecheck` — pass.
- Frontend `npm test` — pass, 2 suites / 3 tests.
- Frontend `NUXT_IGNORE_LOCK=1 npm run build` — pass.

## Known follow-up

- Seed Listening/Video content hiện mới metadata/transcript; production upload workflow cần publish asset audio/video thực (URL/object key) để player phát media thay vì timeline QA.
- Writing submission hiện vào trạng thái `GRADING`; worker/provider AI và admin review queue là phase tiếp theo để tạo `WritingGrade` thực.
