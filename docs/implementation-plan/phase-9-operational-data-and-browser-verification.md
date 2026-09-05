# Phase 9 — Operational data, permission enforcement and browser verification

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Scope delivered

- Seed development idempotent tạo role/plan, tài khoản QA, content đã publish, câu Part 5, thẻ SRS và mini mock test. Cả mật khẩu admin lẫn learner đều bắt buộc truyền bằng environment variable; không có credential mặc định trong source.
- Public catalog API: `GET /content`, `GET /practice/questions`, `GET /mock-tests`.
- Admin operations API: `GET /admin/overview`, `GET /admin/users`, `PATCH /admin/users/:id/status`, `GET /admin/audit`.
- Console admin đọc content/users/audit từ API thật, tìm user, khóa/mở khóa user và có audit trail.
- Reading lưu attempt; Vocabulary tải SRS queue và gửi review; Mock test tạo exam session, tự lưu lựa chọn và nhận result server-side.
- Sửa lỗi RBAC được phát hiện qua E2E: `RolesGuard` không còn chạy global trước JWT. Nó chạy sau `JwtAuthGuard` ở các controller admin có role requirement, nên token admin được cấp quyền đúng và token learner vẫn bị từ chối.

## Browser E2E — desktop

- Account: phiên learner hiển thị đúng display name và `FREE` plan sau khi API auth trả profile đầy đủ.
- Reading: tải câu Part 5 đã publish, chọn đáp án và nhận feedback “tiến bộ đã được lưu”.
- Vocabulary: tải đúng queue 3 thẻ, lật thẻ và chọn mức `Ổn`; UI sang thẻ tiếp theo sau khi API nhận review.
- Mock test: tải `Mini TOEIC Starter`, tạo exam session đã đăng nhập, lưu đáp án, nộp bài và render `1 / 1`, TOEIC quy đổi `990`.
- Admin: đăng nhập admin, content library tải 3 content publish; Users tải role/plan/status; khóa rồi khôi phục tài khoản QA và thấy cả hai audit event trong Audit & health.

## Responsive / intuitive QA

- Mở Chrome ở mobile device metrics `390 × 844` để kiểm tra màn `/admin`.
- Phát hiện grid admin bị nở ngang bởi bảng content/form draft; bổ sung `min-width: 0` cho grid item mobile để bảng tự cuộn trong vùng của nó, không làm tràn cả trang.
- Sau khi sửa, Chrome đo `visualViewport.width = 390`, `documentElement.scrollWidth = 390`, `body.scrollWidth = 390`; hero card rộng `358px`, text wrap đầy đủ.
- Tab admin vẫn cuộn ngang có chủ đích trên mobile; desktop dùng table đầy đủ. Các button đổi tab, reload, search và trạng thái user đều có feedback/loading hoặc disabled state rõ ràng.

## Automated checks

- Backend `npm run typecheck` — pass.
- Backend `npm run lint` — pass (flat ESLint 9 + TypeScript config added).
- Backend `npm test -- --runInBand` — pass, 16 suites / 29 tests.
- Backend `npm run build` — pass.
- Frontend `npm run typecheck` — pass.
- Frontend `npm test` — pass, 2 suites / 3 tests.
- Frontend `NUXT_IGNORE_LOCK=1 npm run build` — pass (giữ Nuxt dev server để browser E2E).

## Notes / follow-up

- Seed data chỉ dành cho local/QA. Production phải inject credential qua secret manager và không chạy seed mẫu.
- Storage provider vẫn chọn server-side qua local/S3-compatible/R2 adapter; secret R2 không xuất hiện trong repository và credential từng lộ ngoài repo cần được rotate trước production.
- Swagger wildcard warning từ Nest vẫn là follow-up hardening riêng; API routes đã kiểm thử không bị ảnh hưởng.
- `npm audit --omit=dev` hiện báo advisory transitive trong Prisma CLI (`deepmerge-ts`); `npm audit fix --dry-run` chưa có thay đổi khả dụng. Theo dõi bản Prisma có remediation trước production.
