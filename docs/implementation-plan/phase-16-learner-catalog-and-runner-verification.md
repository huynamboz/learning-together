# Phase 16 — Catalog và runner cho sáu khu vực học

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Vấn đề

Sáu khu vực học đều nhảy thẳng vào một bài duy nhất do frontend tự chọn: `/listen` tự lấy bài đầu tiên theo part, `/read` lấy một câu grammar, `/write` mở sẵn một prompt, `/vocabulary` vào thẳng phiên SRS, `/mock-test` chỉ có một đề. Người học không thấy admin đã publish những gì, và route contract trong [01-product-requirements](./01-product-requirements.md#2-route-contract-học-viên) yêu cầu catalog tách khỏi runner.

## Scope delivered

### Backend

- `GET /practice/questions?lessonId=` giới hạn câu hỏi theo đúng một bài đã publish, và response thêm `lessonId` để client biết câu thuộc bài nào. Trước đó chỉ lọc được theo kind/part/level nên không thể dựng runner theo bài.
- `GET /vocabulary/sets` và `GET /vocabulary/sets/:slug` là catalog công khai cho bộ từ. Đặt ở controller riêng vì `VocabularyController` guard JWT toàn bộ: xem một bộ có gì không cần tài khoản, chỉ ôn mới cần.
- Seed dựng catalog thật thay cho 3 item mẫu: 5 bài Listening theo Part 1–4, 3 bài ngữ pháp và 1 bài đọc kèm câu hỏi riêng, 3 đề Writing, 3 video, 3 bộ từ vựng và 2 mock test. Tổng 15 content publish. Seed vẫn idempotent và vẫn bắt buộc truyền password qua environment.

### Frontend

| Khu vực | Catalog | Runner |
| --- | --- | --- |
| Nghe | `/listen` — lọc theo part, đếm bài đã gắn audio | `/listen/:slug` |
| Đọc | `/read` — tách nhóm Ngữ pháp / Bài đọc | `/read/:slug` — làm hết câu hỏi của bài, chấm ở server |
| Viết | `/write` — tách Part 1 / Part 2, kèm lịch sử feedback | `/write/:slug` — prompt, giới hạn từ, gửi bài |
| Từ vựng | `/vocabulary` — thẻ đến hạn + danh sách bộ từ | `/vocabulary/test/:slug`, `/vocabulary/review` |
| Đề thi | `/mock-test` — mỗi đề có hai lối vào | `/mock-test/:id/practice`, `/mock-test/:id/exam` |
| Video | `/video` — lọc theo chủ đề | `/video/:slug` |

- `utils/catalog.ts` chuẩn hóa payload content: mọi trường đều đọc phòng thủ nên một bài có payload thiếu vẫn hiện trong danh sách thay vì làm vỡ trang.
- `LessonList` dùng chung cho năm catalog, có empty state phân biệt “chưa publish” với “không tải được”.
- Runner đề thi phân biệt hai chế độ thật: `exam` chạy đồng hồ và tự nộp khi hết giờ, `practice` không đếm ngược. Nộp bài khi còn câu trống sẽ hỏi xác nhận qua dialog dùng chung.

## Browser verification — Chrome DevTools MCP

### Desktop `1440 × 900`

- `/listen` liệt kê 5 bài với bộ lọc Part 1–4 và cho biết 1/5 bài đã gắn audio; mở `/listen/part-1-office-scene` phát được audio từ asset đã publish, transcript mở/đóng đúng.
- `/read/reading-office-relocation` hiện đoạn văn bên cạnh câu hỏi; chọn đáp án B rồi chấm: server trả đúng, toast xác nhận, chip đổi thành “Đúng”, bộ đếm `0 / 2 → 1 / 2`.
- `/vocabulary` hiện thẻ đến hạn (3 thẻ) và 3 bộ từ kèm số từ; `/write`, `/video`, `/mock-test` đều render catalog từ dữ liệu thật với link chi tiết đúng slug/id.

### Mobile `390 × 844`

14 route mới (6 catalog + 8 runner) đều không tràn ngang: `documentElement.scrollWidth` và `body.scrollWidth` bằng `visualViewport.width = 390`.

### Lỗi phát hiện trong lúc verify

Runner đọc dùng nhầm `textOf` (helper cho chuỗi) để đọc `prompt` và nhãn đáp án — vốn là node JSON `{ text: … }` — nên câu hỏi hiện trống. Đã tách `jsonText` riêng và có test chặn cả hai chiều nhầm lẫn.

## Automated checks

- Backend `npm run typecheck`, `npm run lint`, `npm test -- --runInBand` (24 suite / 52 test) — pass.
- Frontend `npm run typecheck` — pass.
- Frontend `npm test` — pass, 4 file / 24 test (thêm 10 test cho chuẩn hóa catalog và đọc JSON từ vựng).
- Frontend `NUXT_IGNORE_LOCK=1 npm run build` — pass.

## Known follow-up

- Tiến độ theo bài chưa hiển thị trong catalog: cần một endpoint trả trạng thái đã làm/đúng/sai theo từng content item.
- Listening mới có một bài gắn audio; các bài còn lại cần upload asset qua console trước khi phát được.
- Route legacy `/grammar` và `/listening` trong docs vẫn chưa có redirect.
- Writing Part 3, đọc song ngữ và game từ vựng vẫn nằm ngoài phạm vi hiện tại.
