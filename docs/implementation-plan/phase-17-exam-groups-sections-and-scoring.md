# Phase 17 — Nhóm câu hỏi, section và quy đổi điểm

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Vấn đề

Phân tích một đề TOEIC Listening & Reading thật (đối chiếu đề mẫu chính thức ETS form ST-05) cho thấy mô hình dữ liệu thiếu bốn thứ, và cả bốn quy về một chỗ: giữa `MockTest` và `Question` không có tầng nào cả.

- Một hội thoại Part 3 nuôi 3 câu, một nhóm Part 7 mang tới 3 văn bản và nuôi 5 câu. `Question` chỉ gắn phẳng vào `contentItemId` nên không có nơi đặt tài liệu dùng chung.
- Media gắn ở cấp `ContentItem`, đúng một file mỗi bài. Part 1 cần 6 ảnh và 6 đoạn audio riêng trong cùng một part.
- `MockTest` chỉ có một `durationMin`, không diễn đạt được “nghe 45 phút chạy theo băng, đọc 75 phút tự phân bổ”.
- `calculateExamScore` tính `correct / total × 990` tuyến tính. TOEIC chấm Listening và Reading riêng, mỗi phần 5–495, theo bảng quy đổi khác nhau ở từng đề.

## Scope delivered

### Schema

Migration `20260906125450_add_question_groups_sections_and_score_conversion`:

| Bảng | Vai trò |
| --- | --- |
| `MockTestSection` | `kind` LISTENING/READING, `label`, `durationMin`, `sortOrder` |
| `QuestionGroup` | `type` (7 dạng), `part`, `stimulus` JSON, `transcript`, `audioAssetId` kèm `audioStartSec`/`audioEndSec` |
| `QuestionGroupMedia` | ảnh/biểu đồ có thứ tự cho một nhóm |
| `ScoreConversion` | `testId + section + rawCorrect → scaled`, theo từng đề |

`Question` thêm `groupId`, `numberInTest` (số câu 1–200 như in trong đề) và `optionsHidden`. `MockTestQuestion` thêm `sectionId`. `ExamResult` thêm `listeningCorrect`, `readingCorrect`, `listeningScaled`, `readingScaled` và `scoreSource`.

`audioStartSec`/`audioEndSec` cho phép một file 45 phút phục vụ mọi nhóm nghe thay vì bắt cắt sẵn 48 đoạn.

### Chấm điểm

`scoreExam` chấm từng section trên số câu của chính nó, tra bảng quy đổi của đề, và **luôn trả về `scoreSource`** để không có chỗ nào trình bày ước lượng như điểm thật:

- `OFFICIAL_TABLE` — đề có bảng quy đổi riêng.
- `ESTIMATED` — chưa có bảng; ước lượng bám đúng lưới 5–495 (hoặc 10–990 cho đề chưa chia section).
- `RAW_ONLY` — không đủ dữ liệu, `score` trả `null` thay vì bịa số 0.

### API và UI

- `POST /exam-sessions` trả thêm `sections`, `groups` và mỗi câu kèm `groupId`, `sectionId`, `numberInTest`, `optionsHidden`. Thời gian của đề có section là tổng thời gian các section.
- `GET /mock-tests` trả `sections` và `hasScoreTable`, nên catalog nói rõ đề nào cho điểm thật, đề nào chỉ ước lượng.
- `GET /practice/questions` trả kèm nhóm, dùng được cho bài học ngoài đề thi.
- Runner đề thi render stimulus của nhóm (tranh, audio, các văn bản, hướng dẫn), hiện số câu thật và vị trí trong nhóm, và **Part 1/2 chỉ hiện chữ cái A/B/C(/D)** đúng như đề in.
- Màn kết quả tách điểm Nghe và Đọc, kèm câu ghi rõ điểm đến từ bảng quy đổi hay chỉ là ước lượng.

### Seed

Thêm đề `mini-toeic-full-format` — 16 câu, 2 section (Nghe 8′, Đọc 12′), đủ **cả 7 dạng nhóm**: mô tả tranh, hỏi đáp ngắn 3 đáp án, hội thoại 3 câu, bài nói 3 câu, hoàn thành câu, hoàn thành đoạn văn có câu chèn, và bộ hai văn bản có câu chèn `[1]`–`[4]`. Kèm bảng quy đổi đầy đủ cho cả hai section.

## Verification

### Chấm điểm — bằng chứng cho lỗi cũ

Cùng một đề, hai kết quả đối xứng:

| Bài làm | Nghe | Đọc | Tổng | Nguồn |
| --- | --- | --- | --- | --- |
| Đúng hết phần nghe | 8/8 → 495 | 0/8 → 5 | **500** | OFFICIAL_TABLE |
| Đúng hết phần đọc | 0/8 → 5 | 8/8 → 470 | **475** | OFFICIAL_TABLE |

Công thức tuyến tính cũ cho cả hai cùng một điểm. Đây chính là lỗi mà bảng quy đổi theo section sửa được.

### Browser — Chrome DevTools MCP

- Desktop `1440 × 900`: catalog hiện `Nghe 8′ · Đọc 12′ · Có bảng quy đổi`; Part 1 chỉ hiện A/B/C/D kèm ghi chú “bốn phương án chỉ được đọc trong audio”; Part 3 hiện `CÂU 33 · 2/3 trong nhóm`; Part 7 hiện cả hai văn bản kèm mốc chèn `---[1]---`…`---[4]---`; màn kết quả tách `NGHE 5` / `ĐỌC 65` với dòng “Quy đổi theo bảng điểm của chính đề này.”
- Mobile `390 × 844`: catalog, màn bắt đầu và runner (đang chạy đồng hồ) đều không tràn ngang.

### Automated checks

- Backend `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` (24 suite / 60 test) — pass. Thêm 8 test cho chấm điểm theo section, tra bảng và nhãn nguồn điểm.
- Frontend `npm run typecheck`, `npm test` (4 file / 24 test), `NUXT_IGNORE_LOCK=1 npm run build` — pass.

## Known follow-up

- Đồng hồ mới tính theo tổng thời gian; chưa khoá từng section riêng khi hết giờ phần nghe.
- `QuestionGroupMedia` đã có nhưng admin console chưa có UI gắn nhiều ảnh vào một nhóm; Part 1 hiện hiển thị caption thay cho ảnh.
- Import vẫn nhận JSON phẳng; gói ZIP kèm manifest cho một đề 200 câu là việc tiếp theo.
- Chưa có trường `source`/`license` trên đề, nên chưa chặn được việc publish công khai tài liệu có bản quyền.
