# Phase 19 — Sửa, đổi thứ tự, import cả đề và bản quyền

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Vấn đề

Console dựng đề ở Phase 18 mới chỉ **thêm**: sửa một câu sai phải vào DB, không đổi được thứ tự nhóm, nhập tay từng câu không khả thi với đề 200 câu, và không có chỗ nào ghi đề lấy từ đâu — nghĩa là không có gì ngăn việc publish tài liệu có bản quyền.

## Scope delivered

### Sửa và xoá

| Endpoint | Việc |
| --- | --- |
| `PATCH /admin/exams/:id` | tên, thời lượng, **nguồn** và **bản quyền** |
| `PATCH` · `DELETE /admin/exams/sections/:id` | sửa nhãn/thời lượng, xoá section |
| `DELETE /admin/exams/groups/:id` | xoá nhóm |
| `PATCH` · `DELETE /admin/exams/questions/:id` | sửa và xoá câu hỏi |

Xoá section hoặc nhóm kéo theo câu hỏi bên trong **và** bản ghi `MockTestQuestion` của chúng, trong cùng một transaction — nếu không, câu hỏi sẽ sống sót mà không còn stimulus lẫn section.

Sửa câu hỏi thay **toàn bộ** danh sách phương án chứ không vá từng ô: sửa một phần sẽ để lại ký hiệu mồ côi. Đáp án đúng được kiểm với danh sách **mới**, không phải danh sách cũ.

### Đổi thứ tự

`PUT /admin/exams/sections/:id/group-order` nhận nguyên danh sách id và từ chối nếu nó không đúng bằng tập nhóm của section — một tab cũ không thể vô tình làm rơi một nhóm. Ghi theo hai lượt: đẩy các dòng ra vùng âm trước rồi mới đặt lại thứ tự, để ràng buộc unique `(section, sortOrder)` không vỡ giữa chừng.

### Import cả đề

`POST /admin/exams/:id/import` nhận một manifest JSON mô tả toàn bộ `sections → groups → questions`.

- Ảnh và audio gọi theo **tên tệp** đã có trong media library, không phải id. Tệp vẫn upload ở màn Media, manifest chỉ mang cấu trúc — nên không cần giải nén ZIP ở server, cũng không có bề mặt zip-slip.
- `dryRun` kiểm tra rồi báo cáo mà không ghi gì. Mọi lỗi trả về kèm **đường dẫn gây lỗi**, ví dụ `sections[0].groups[1].questions[1].answerKey`, nên một manifest 200 câu quay về dưới dạng danh sách việc phải sửa thay vì một thông báo thất bại.
- Kiểm tra gồm: dạng nhóm phải khớp part của chính nó, ảnh chỉ ở Part 1/3/4, mốc audio kết thúc phải sau mốc bắt đầu, số câu không trùng **trên toàn đề**, đáp án nằm trong phương án, và mọi tệp được gọi tên phải có asset `READY` + công khai.
- Không ghi gì nếu còn lỗi. Một đề nhập dở dang tệ hơn là không nhập.

### Nguồn và bản quyền

`MockTest` thêm `source` và `license` (`ORIGINAL | LICENSED | RESTRICTED`). Publish từ chối đề `RESTRICTED`, và **đánh dấu một đề đang live là hạn chế sẽ tự đưa nó về nháp** — đó là hành động có ích duy nhất khi phát hiện tài liệu không được phép phát hành.

### Console

Form thêm câu hỏi kiêm luôn form sửa; nút ↑ ↓ ✕ nằm cạnh mỗi nhóm; section sửa được tại chỗ; và panel import có “Chạy thử” tách khỏi “Import thật”, hiển thị lỗi theo đường dẫn.

## Verification

### Import — chạy thật

1. Tạo đề trống rồi chạy thử manifest 2 section / 3 nhóm / 4 câu / 1 ảnh / 2 dòng quy đổi → `applied: false`, không lỗi, không ghi gì.
2. Cố ý làm hỏng ba chỗ — đáp án ngoài danh sách, dạng nhóm sai part, số câu trùng — báo về đúng ba lỗi kèm đường dẫn:
   - `sections[0].groups[1].questions[1].answerKey`
   - `sections[0].groups[1].questions[1].numberInTest` — “Số câu 32 đã dùng ở …questions[0]”
   - `sections[1].groups[0].part` — “Dạng SINGLE_SENTENCE thuộc Part 5, không phải 7”
3. Import thật → ghi đủ 2 section, 3 nhóm, 4 câu, khớp ảnh `part1-photo.png` theo tên tệp và ghi 2 dòng quy đổi.

### Bản quyền — chạy thật

`publish` khi `ORIGINAL` → `PUBLISHED`. Đổi sang `RESTRICTED` → status tự về `DRAFT`. Publish lại → `MOCK_TEST_RESTRICTED`. Kho đề của người học không còn đề đó.

### Đổi thứ tự — trên giao diện

Bấm ↑ ở nhóm thứ hai: thứ tự đổi từ `Part 1 · Part 3 · Part 5` sang `Part 3 · Part 1 · Part 5` và giữ nguyên sau khi tải lại.

### Lỗi phát hiện lúc verify

Khối `<style scoped>` bị chèn nhầm vào **bên trong** `<template>` do patch khớp phải thẻ `</template>` lồng của một slot. `nuxt typecheck` không bắt được — chỉ khi mở trang mới thấy overlay lỗi biên dịch của Vite. Đã chuyển khối ra sau template gốc.

### Automated checks

- Backend `npm run lint`, `npm run typecheck`, `npm test -- --runInBand` (26 suite / 90 test) — pass. Thêm 18 test: quy tắc xoá kéo theo, đổi thứ tự hai lượt, sửa câu hỏi, bản quyền, và bộ kiểm tra manifest.
- Frontend `npm run typecheck`, `npm test` (33 test), `NUXT_IGNORE_LOCK=1 npm run build` — pass.
- Mobile `390 × 844`: `/admin/exams` với đề và nhóm Part 7 đang mở không tràn ngang.

## Known follow-up

- Chưa xoá được **cả một đề**. Việc này cần một quyết định chính sách trước: kết quả `ExamSession`/`ExamResult` đã gắn với đề sẽ ra sao — giữ lại, ẩn đi, hay xoá theo.
- Manifest vẫn phải dán vào ô text; chưa có upload tệp `.json`.
- Chưa kéo thả để đổi thứ tự; hiện dùng nút ↑ ↓.
- Đồng hồ vẫn tính theo tổng thời gian, chưa khoá riêng từng section khi hết giờ phần nghe.
