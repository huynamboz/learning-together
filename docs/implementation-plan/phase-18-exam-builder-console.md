# Phase 18 — Console dựng đề thi

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Vấn đề

Phase 17 đưa `QuestionGroup`, `MockTestSection` và `ScoreConversion` vào schema, nhưng chỉ seed mới ghi được vào đó. Admin console không có màn nào để dựng đề, và điểm còn thiếu cụ thể nhất là **gắn nhiều ảnh vào một nhóm** — Part 1 cần một ảnh cho mỗi nhóm, Part 3 và 4 cần biểu đồ cho câu “nhìn hình”.

## Scope delivered

### API — `admin/exams`

Một module mới, quyền `CONTENT_EDITOR | ADMIN | SUPER_ADMIN`, mọi mutation đều ghi audit trong transaction.

| Endpoint | Việc |
| --- | --- |
| `GET /admin/exams` · `GET /admin/exams/:id` | danh sách kèm số câu/section/dòng quy đổi, và toàn bộ cây section → nhóm → câu hỏi |
| `POST /admin/exams` · `POST /admin/exams/:id/publish` | tạo đề, publish (từ chối đề chưa có câu nào) |
| `POST /admin/exams/:id/sections` · `POST /admin/exams/:id/groups` | thêm section, thêm nhóm vào đúng section của đề |
| `PATCH /admin/exams/groups/:id` | tài liệu nhóm: hướng dẫn, văn bản, transcript, audio kèm mốc thời gian |
| `POST` / `DELETE /admin/exams/groups/:id/media` | gắn và gỡ ảnh theo thứ tự |
| `POST /admin/exams/groups/:id/questions` | thêm câu hỏi vào nhóm |
| `PUT /admin/exams/:id/conversions` | thay toàn bộ bảng quy đổi |

Ràng buộc được kiểm ở service chứ không phó mặc cho UI: đáp án đúng phải nằm trong danh sách phương án, hai phương án không được trùng ký hiệu, chỉ Part 1/3/4 nhận ảnh, asset phải `READY` + công khai + đúng MIME, và bảng quy đổi bị từ chối khi có dòng trùng `section + rawCorrect`.

Thêm câu hỏi vào nhóm **đồng thời** ghi `MockTestQuestion` kèm `sectionId`, nên câu mới vào đúng đề và đúng section mà không cần thao tác thứ hai.

Bảng quy đổi được thay nguyên khối trong một transaction — một bảng ghi dở sẽ chấm sai mọi kết quả sau đó.

### Console — `/admin/exams`

Ba cột việc: danh sách đề và form tạo đề; cây section → nhóm với nút thêm ở từng cấp; và panel nhóm đang mở.

- Panel nhóm nhập **tài liệu có cấu trúc** thay vì JSON thô: hướng dẫn, mô tả tranh, danh sách văn bản có nhãn (thêm/xoá từng cái), transcript, audio kèm giây bắt đầu/kết thúc.
- Khu **ảnh và biểu đồ** liệt kê ảnh đã gắn kèm nút gỡ có xác nhận, và chỉ hiện với Part 1/3/4. Khi chưa có ảnh nào công khai, UI nói thẳng phải upload ở màn Media rồi bấm “Cho phép phát”.
- Form thêm câu hỏi **tự khớp dạng nhóm**: Part 2 hiện đúng ba ô A–C, Part 1 và 2 tự bật `optionsHidden` kèm cảnh báo rằng part này không in phương án ra giấy.
- Bảng quy đổi nhập dạng `LISTENING,42,320` mỗi dòng, validate ngay khi gõ và báo đúng số dòng lỗi trước khi cho lưu.

### Runner

Câu hỏi trong đề giờ hiển thị **ảnh thật** của nhóm qua `/media/:id/file`; caption chỉ còn là phương án dự phòng khi nhóm chưa gắn ảnh.

## Verification

### Vòng đời đầy đủ, chạy thật

1. Upload một PNG 320×200 qua upload session (`201`).
2. Chuyển asset sang công khai (`200`).
3. Trong `/admin/exams`: mở đề `Mini TOEIC · đủ 7 dạng`, mở nhóm Part 1, chọn ảnh trong danh sách asset công khai, bấm gắn — toast xác nhận và ảnh xuất hiện trong danh sách kèm nút gỡ.
4. Đăng nhập learner, mở đề ở chế độ luyện tập: `<img>` trong panel “TRANH” trỏ đúng `/api/v1/media/<id>/file` và `naturalWidth = 320` — ảnh thật đã render, không phải placeholder.

### Browser

- Desktop `1440 × 950`: cây đề hiện đúng Listening 8′ (4 nhóm Part 1–4) và Reading 12′ (4 nhóm Part 5, 5, 6, 7) kèm số câu của từng nhóm; bảng quy đổi nạp sẵn 18 dòng và báo “18 dòng hợp lệ”.
- Mobile `390 × 844`: `/admin/exams` với đề và nhóm Part 7 đang mở vẫn giữ `documentElement.scrollWidth = body.scrollWidth = visualViewport.width = 390`.

### Automated checks

- Backend `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` (25 suite / 72 test) — pass. Thêm 12 test cho ràng buộc của exam builder.
- Frontend `npm run typecheck`, `npm test` (5 file / 33 test), `NUXT_IGNORE_LOCK=1 npm run build` — pass. Thêm 9 test cho map dạng nhóm và parser bảng quy đổi.

## Known follow-up

- Chưa sửa hay xoá được nhóm/câu hỏi đã tạo — mới chỉ thêm. Sửa một câu sai hiện phải làm qua DB.
- Chưa kéo thả để đổi thứ tự nhóm hoặc câu.
- Import ZIP kèm manifest cho đề 200 câu vẫn chưa có; nhập tay từng câu chỉ hợp lý với đề nhỏ.
- Vẫn chưa có `source`/`license` trên đề để chặn publish tài liệu có bản quyền.
