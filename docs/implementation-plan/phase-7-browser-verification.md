# Phase 7 — Admin browser verification

Ngày verify: 2026-09-06 02:20 (Asia/Ho_Chi_Minh)

## Routes and operations verified

- `/admin` Content: search/filter, create draft với payload JSON, publish draft và trạng thái Live.
- `/admin` Import: mở module, validate batch JSON hợp lệ và hiển thị số row normalize/lỗi.
- `/admin` Media: mở upload UI, allowlist MIME + giới hạn file, hiển thị file selection state; upload session sẽ gọi API thật khi có admin token.
- `/admin` Audit & health: hiển thị API health, database migration và storage provider state.

## Responsive / accessibility

- Desktop screenshot + accessibility tree kiểm tra đủ tab/module, table content và form controls.
- Mobile screenshot + accessibility tree xác nhận navigation responsive, tabs admin có thể cuộn ngang và content table giữ min-width để không làm vỡ layout.
- Demo fallback được ghi rõ khi chưa có Bearer admin token; không giả vờ đã đồng bộ server.

## Automated checks

- `npm run typecheck` — pass
- `npm test` — pass (1 test)
- `NUXT_IGNORE_LOCK=1 npm run build` — pass

## Ghi chú

Admin API vẫn được bảo vệ bằng `JwtAuthGuard` + role guard ở backend. UI demo chỉ phục vụ preview/QA; thao tác thật dùng token và storage provider cấu hình server-side.
