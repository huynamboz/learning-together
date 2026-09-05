# Phase 10 — Content, engagement and learner-history plan

## Mục tiêu

Thay các màn learner còn là preview bằng dữ liệu publish và mutation có thể truy vết. Phase này không thêm mock AI grader hay media streaming thật; nó hoàn thiện contract để hai capability đó có nơi gắn vào mà không thay đổi UI flow.

## API contract

| Surface | Contract | Quyền | Hành vi UI |
| --- | --- | --- | --- |
| Listening catalog | `GET /content?type=LISTENING&part={1..4}` | Public | Lấy title, transcript, duration từ version payload; fallback chỉ khi offline/empty catalog. |
| Listening activity | `POST /learning/study-sessions` | Authenticated | Lưu `surface`, số giây người học thực sự nghe và `endedAt`; được gọi khi xác nhận bài nghe. |
| Video catalog | `GET /content?type=VIDEO` | Public | Dùng title, summary/category, duration trong payload để làm playlist. |
| Community feed | `GET /community/posts`, `GET /community/posts/:id/comments` | Authenticated | Trả author display name đã resolve, tags, count, thời gian và danh sách trả lời. |
| Community write | `POST /community/posts`, `POST /community/posts/:id/comments` | Authenticated | Thêm post/comment server-side, cập nhật feed/count ngay trên UI. |
| Writing history | `GET /writing/submissions` | Authenticated | Trả tối đa 20 submission của chính user cùng grade nếu có; không lộ bài người khác. |

## Backend design

- `StudySession` đã tồn tại trong Prisma schema. Dùng một command `recordStudySession` (create session đã kết thúc) thay vì tạo session mồ côi khi user chỉ mở trang.
- `CommunityService` batch-resolve author qua một `User.findMany` theo danh sách authorId. Điều này tránh N+1 và không đòi migration quan hệ Prisma.
- `WritingService.list` luôn scope `userId`, sort mới nhất trước, select body + grade tối thiểu cần render.
- DTO StudySession allowlist surface, giới hạn `durationSeconds` để không thể bơm số liệu vô hạn.
- Các mutation vẫn kế thừa JWT guard; thất bại trên UI dùng thông báo cụ thể và không giả vờ sync thành công.

## Frontend design & interaction plan

Palette/tokens hiện hữu được giữ: Ink `#17213F`, Iris `#5D5FEF`, Leaf và Bean là tín hiệu trạng thái. Hình ảnh đặc trưng của phase là **nhịp học**: Listening cho phép theo dõi thời lượng đã nghe, Video biến kho content thành danh sách chọn rõ ràng, Community có composer và phần trả lời mở đúng lúc. Không thêm gradient/card trang trí vô nghĩa.

```text
Listening: [part selector] → [published clip + progress] → [answer] → [saved activity]
Video:     [selected lesson] ← [published playlist]
Community: [composer] → [post] → [open reply row] → [comment count]
Writing:   [prompt + editor] → [submission state] → [recent history]
```

- Hiển thị fallback/offline rõ ràng thay vì gọi nó là content thật.
- Giữ control keyboard/focus, loading/disabled states và responsive grid `min-width: 0` để list/table không làm tràn toàn trang ở mobile.
- Motion chỉ dùng cho play/pause, flip/open reply và submit feedback — phản hồi hành động, không phải trang trí tự chạy.

## Verification gate

1. Unit test: study session payload/limit, community author resolution + mutation, writing list ownership/order.
2. Backend lint/typecheck/test/build; frontend typecheck/test/build.
3. Browser E2E desktop: load seeded Listening/Video, save listening activity, create a community post + comment, submit writing and see history.
4. Browser responsive: Chrome device metrics `390 × 844`, assert `visualViewport` và document width bằng nhau, review composer/playlist/listening controls bằng screenshot/accessibility tree.
5. Update Phase 10 verification log and make one atomic commit after all gates pass.
