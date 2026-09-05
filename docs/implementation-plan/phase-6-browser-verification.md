# Phase 6 — Learner browser verification

Ngày verify: 2026-09-06 02:16 (Asia/Ho_Chi_Minh)

## Routes verified

- `/listen`: play/pause mô phỏng audio, progress, chọn part, transcript, nhập câu trả lời và feedback.
- `/read`: chọn đáp án, kiểm tra, hiển thị giải thích và reset câu.
- `/vocabulary`: lật flashcard, hiển thị nghĩa/ví dụ, rating SRS và chuyển thẻ.
- `/mock-test`: bắt đầu test, countdown, chọn đáp án, chuyển câu, nộp bài và hiển thị điểm.
- `/write`: nhập bài, word count, submit và phản hồi trạng thái.
- `/video`: play/pause mô phỏng video và đổi video trong thư viện.
- `/hoi-dap`: nhập và đăng bài mới vào feed local; API được gọi nếu có access token.
- `/leaderboard`, `/upgrade`: hiển thị dữ liệu fallback rõ ràng và trạng thái loading/chọn gói.

## Responsive / accessibility

- Desktop in-app browser đã kiểm tra accessibility tree và screenshot cho các flow chính.
- Mobile in-app browser đã kiểm tra navigation responsive, route `/listen`, `/vocabulary`, control Cài đặt và interaction flashcard.
- Các control có label/feedback; nút chưa sẵn sàng bị disable có chủ đích hoặc hiển thị fallback rõ ràng.

## Automated checks

- `npm run typecheck` — pass
- `npm test` — pass (1 test)
- `NUXT_IGNORE_LOCK=1 npm run build` — pass

## Ghi chú

Nội dung mẫu giúp kiểm thử UI ngay cả khi database chưa seed. `useAppApi` tự gắn Bearer token từ cookie nếu người dùng đăng nhập; các màn learner sẽ chuyển sang đồng bộ API khi có dữ liệu/id thật.
