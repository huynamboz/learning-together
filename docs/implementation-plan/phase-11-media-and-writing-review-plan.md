# Phase 11 — Media delivery and Writing review plan

## Mục tiêu

Chuyển hai điểm còn “chờ xử lý” của Phase 10 thành luồng vận hành được thật:

1. Admin upload một asset, xác nhận nó sẵn sàng/phát công khai, gắn nó vào Listening hoặc Video đã publish; learner nhận URL phát media qua catalog.
2. Bài Writing ở trạng thái `GRADING` đi vào hàng chờ review của admin; admin nhập đánh giá theo rubric, publish `WritingGrade` và learner thấy feedback ngay trong lịch sử của chính mình.

Phase này **không** gọi model AI bên ngoài, không tự tạo điểm hay feedback. Manual review là capability đúng nghĩa, đồng thời là ranh giới contract an toàn để sau này worker AI có thể ghi cùng `WritingGrade`.

## Contracts và quyền

| Capability | Endpoint | Quyền | Điều kiện / kết quả |
| --- | --- | --- | --- |
| Phát asset công khai | `GET /media/:id/file` | Public | Chỉ `READY` + `visibility=public`; local storage stream qua API, S3/R2 stream từ provider; trả đúng MIME và không lộ credential. |
| Xem asset vận hành | `GET /admin/media` | ADMIN / SUPER_ADMIN / CONTENT_EDITOR | Danh sách asset, trạng thái, MIME, visibility, người tạo, thời điểm và ID để truy vết. |
| Đổi visibility | `PATCH /admin/media/:id/visibility` | ADMIN / SUPER_ADMIN / CONTENT_EDITOR | Allowlist `public|private`; chỉ asset `READY` mới được public; ghi audit event. |
| Gắn asset vào content | `PATCH /admin/content/:id/media` | ADMIN / SUPER_ADMIN / CONTENT_EDITOR | Asset phải `READY` + public, MIME phải khớp surface (`audio/*` cho LISTENING, `video/*` cho VIDEO). Tạo version payload mới với `mediaAssetId`, không sửa history version. |
| Review Writing | `GET /admin/writing/submissions?status=GRADING`, `POST /admin/writing/submissions/:id/grade` | ADMIN / SUPER_ADMIN / MODERATOR | Queue chỉ hiển thị scope review; grade 0–10, rubric/feedback typed JSON, đổi status `GRADING → GRADED`, ghi audit. |
| Learner thấy feedback | `GET /writing/submissions`, `GET /writing/submissions/:id` | Owner | Chỉ owner; trả grade sau khi reviewer lưu. |

`mediaAssetId` nằm trong payload version của content. Learner-facing catalog chuyển nó thành `mediaUrl` dựa trên `apiBase`, ví dụ `/media/{id}/file`; browser audio/video giữ URL này làm `src`. Payload cũ không có asset vẫn render bình thường với trạng thái “chưa có media”, không nhận một URL bịa đặt.

## Backend design

### Media delivery

- Mở rộng storage port bằng read stream + metadata. `LocalStorage` resolve path dưới root đã kiểm soát và stream file; S3-compatible adapter dùng `GetObject` với credential chỉ ở server. Không trả `local://` cho browser.
- Media controller tách public read endpoint khỏi các mutation cần JWT. Response đặt `Content-Type`, `Content-Length` khi có, `Content-Disposition: inline` và cache policy ngắn; không log signed URL/credential.
- `MediaService.openPublicAsset` kiểm tra id, `READY`, visibility trước khi đọc storage. Private/pending/deleted trả lỗi domain không tiết lộ object key.
- Admin media query có pagination bounded. Visibility mutation và attach media đều ghi `AuditLog` trong transaction.

### Content versioning

- `attachMedia` đọc `ContentItem.currentVersion`, lấy payload hiện tại, copy payload + set `mediaAssetId`, tạo `ContentVersion(current + 1)` và atomically cập nhật `currentVersion`/`updatedById`.
- Validation reject pairing sai surface/mime trước khi ghi: Listening chỉ nhận audio; Video chỉ nhận video. Content type khác nằm ngoài scope phase này.
- Catalog service không phải gọi provider: nó chỉ exposes `mediaAssetId` đã validate; frontend derive delivery URL từ API base. Nhờ vậy content payload luôn portable giữa local/S3/R2.

### Writing review

- `WritingSubmission` đã có one-to-one `WritingGrade`; grade command dùng transaction, chỉ accept submission `GRADING`, upsert grade và set `GRADED` cùng lúc. Lần gọi lặp/review đã đóng trả conflict thay vì silently overwrite reviewer khác.
- DTO nhỏ, explicit: `overall` number 0–10; `rubric` và `feedback` phải là object, not arbitrary string. `provider` ghi `manual-review` để future AI/worker data distinguish được nguồn.
- Queue hide user private fields không cần thiết; detail endpoint / response review phục vụ content, word count, part và author label cho moderator. User vẫn chỉ truy cập `WritingService` owner scope.
- Không trừ thêm credit khi grade: credit được consume duy nhất tại submit. Failed manual review không làm credit transaction đảo chiều trong phase này; error được surfaced để operator retry có chủ đích.

## Frontend interaction

```text
Admin Media
select file → upload session → READY/private → make public → attach to lesson
                                                     ↓
Learner catalog → mediaAssetId → /media/:id/file → native audio/video control

Writing
learner submit → GRADING → admin review queue → GRADED + rubric/feedback → learner history/detail
```

- Admin Media chuyển từ một upload box đơn lẻ thành queue nhỏ có trạng thái asset thật, visibility action và attach target. Chỉ show action hợp lệ; upload failure giữ file selection và error có thể đọc lại.
- `/listen` render native `<audio controls>` nếu item có `mediaAssetId`; `video` render native `<video controls>` tương tự. Khi asset không có hoặc request lỗi, UI nói rõ media chưa sẵn sàng thay vì animate một player giả.
- Admin Writing tab ưu tiên list `GRADING`, mở từng bài trong panel review; focus đi vào điểm trước, disable nút khi submit, then optimistic refresh only after success.
- Learner Writing history hiển thị `GRADED`, overall và feedback summary; raw rich HTML không được render. Tất cả layout dùng `min-w-0`, horizontal scroll bị kiểm tra ở 390 px.

## Test và browser verification gate

1. Unit tests: media ready/visibility/mime policy, attach creates next content version, review transition + audit + conflict, owner scope remains unchanged.
2. Backend lint, typecheck, test and build; frontend typecheck, test and build.
3. Browser desktop E2E: upload a benign WAV through admin, mark it public, attach it to a Listening draft/published item, confirm native audio has API delivery `src`; create a writing submission, grade it in admin, confirm learner history renders `GRADED` feedback.
4. Browser mobile E2E at `390 × 844`: no horizontal overflow on admin review/media, Listening player and writing feedback stay actionable.
5. Document concrete evidence/known limitations and make one atomic Phase 11 commit only after all gates pass.

## Scope boundaries / follow-up

- No public bucket, CDN transform, range request, waveform/transcoding, virus scanner, resumable multipart upload or video adaptive streaming yet. Native playback is intentionally the reliable baseline.
- No real AI provider/queue/retry yet. A later worker must reuse the same grade transaction and add idempotency/job observability.
- R2/S3 credentials remain environment-only. Rotate any credentials that have been pasted outside a secret manager before production; never place them in source, documentation or screenshots.
