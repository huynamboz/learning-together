# Phase 15 — Admin console routes, toast và dialog

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Scope delivered

### Admin console tách route theo docs

`/admin` trước đây là một page 292 dòng với 6 tab giữ trong `ref`, lệch với route contract ở [01-product-requirements](./01-product-requirements.md#3-route-admin). Console được tách thành layout riêng và các route thật:

| Route | Nội dung | API dùng |
| --- | --- | --- |
| `/admin` | KPI, việc đang chờ, trạng thái dịch vụ, audit gần đây | `GET /admin/overview`, `GET /health` |
| `/admin/content` | Library + filter type/status, tạo draft, publish | `GET/POST /admin/content`, `POST /admin/content/:id/publish` |
| `/admin/media` | Upload session, đổi visibility, gắn asset vào bài | `POST /media/upload-sessions`, `GET/PATCH /admin/media` |
| `/admin/imports` | Validate batch JSON, lỗi theo dòng | `POST /admin/imports` |
| `/admin/writing` | Hàng chờ chấm, panel review, lưu grade | `GET/POST /admin/writing/submissions` |
| `/admin/users` | Access review, đổi trạng thái tài khoản | `GET /admin/users`, `PATCH /admin/users/:id/status` |
| `/admin/audit` | Audit trail đầy đủ, lọc theo entity | `GET /admin/audit` |

- `layouts/admin.vue` là chrome riêng của console: rail tối, breadcrumb, badge hàng chờ Writing và access gate. Gate phân biệt rõ ba trạng thái: chưa đăng nhập, đăng nhập nhưng thiếu vai trò vận hành, và có quyền.
- `useAdminConsole` giữ overview + profile trong state dùng chung, nên badge ở rail và các module đọc cùng một snapshot thay vì mỗi route tự fetch lại.
- Logic thuần (quyền, hàng chờ, format) nằm trong `utils/admin.ts` để test được mà không cần dựng Nuxt.
- Icon của rail được vendor vào `AppIcon` thay vì fetch từ Iconify API lúc runtime — xoá follow-up đã ghi ở Phase 14.

### Toast và Dialog dùng chung

- `useToast()` + `ToastHost`: stack top-center tối đa 4 toast, tự tắt theo tone (success 4s, info 5s, error 7s), hover/focus dừng đếm ngược và tiếp tục đúng thời gian còn lại. Progress bar là CSS animation, dismissal do timer JS quyết định để reduced-motion không làm toast biến mất tức thì.
- `AppDialog`: dựng custom (không dùng native `<dialog>`) để kiểm soát hoàn toàn hình thức. Đổi lại phải tự làm phần native cho sẵn — focus trap hai chiều, Escape, `aria-modal` + `aria-labelledby`, khoá scroll có bù scrollbar, và trả focus về đúng nút đã mở dialog.
- Cả hai dùng `corner-shape: squircle` cho continuous corner, animation vào/ra tách riêng cho backdrop và panel.
- `useConfirm()` cho phép `await confirm({...}, action)`: khi truyền action, dialog giữ trạng thái busy tới khi API trả lời nên thao tác destructive không thể bấm hai lần.
- Áp dụng thật: khoá tài khoản ở `/admin/users` bây giờ phải xác nhận trước — đúng yêu cầu “action destructive phải confirm và audit” trong docs. Mọi notice dạng banner của admin chuyển sang toast.

## Browser verification — Chrome DevTools MCP

Runtime: web `http://localhost:3011`, API `http://localhost:3010`, seed local với password truyền qua environment.

### Desktop `1440 × 900`

- Đăng nhập admin: overview đọc số thật (3 tài khoản, 3 content published, 1 asset READY, 2 bài Writing chờ), health trả `ok` từ `/api/v1/health`, audit hiển thị đúng sự kiện đã ghi.
- Content: tạo draft `Part 2 · Response drill` → toast success, bộ đếm chuyển `Published 3 / Draft 1`, row mới có action Publish; publish → toast success và row chuyển `PUBLISHED`.
- Users: bấm “Tạm khóa” mở confirm dialog; xác nhận → tài khoản chuyển `SUSPENDED`, bộ đếm `Active 2 / Đang khóa 1`, toast xác nhận; kích hoạt lại trả về `ACTIVE`.
- Import: batch sai trả 4 lỗi theo dòng và một toast error.
- Accessibility đo trực tiếp trên dialog: focus vào panel khi mở, `aria-modal="true"`, `aria-labelledby` trỏ đúng tiêu đề, body khoá scroll khi mở và nhả khi đóng, Escape đóng, focus trả về đúng nút đã mở, Tab wrap hai chiều trong panel.

### Mobile `390 × 844`

- Bảy route admin đều trả `visualViewport.width = 390`, `documentElement.scrollWidth = 390`, `body.scrollWidth = 390`.
- Dialog rộng 358px trong viewport 390px, hai nút chia đều hàng; toast neo top-center đúng tâm viewport.

## Automated checks

- Frontend `npm run typecheck` — pass.
- Frontend `npm test` — pass, 3 file / 14 test (thêm 11 test cho quyền admin, hàng chờ, format và stack toast).
- Frontend `NUXT_IGNORE_LOCK=1 npm run build` — pass.

## Known follow-up

- `/admin/community`, `/admin/billing`, `/admin/analytics`, `/admin/settings` trong route contract vẫn chưa có vì backend chưa có endpoint tương ứng.
- Import mới dừng ở validate và ghi batch; rollback, review diff và publish theo từng item vẫn là phần còn lại của workflow trong docs.
- `npm run lint` vẫn chưa chạy được do package thiếu executable `eslint`.
