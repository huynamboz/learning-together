# Phase 5 — Browser verification

Ngày verify: 2026-09-06 02:10 (Asia/Ho_Chi_Minh)

## Môi trường

- Frontend dev server: `http://localhost:3011/`
- Desktop in-app browser: dashboard tại `/`
- Mobile in-app browser: viewport responsive được khởi tạo ở kích thước mobile

## Kết quả

- Desktop render đúng shell, typography, Study Trail, metric cards, quick links, goal board, activity timeline và chat launcher.
- Desktop notification button mở/đóng popover; account và upgrade trỏ tới route hợp lệ.
- Chat launcher mở ChatDock; nút đóng hoạt động; tab `Cộng đồng`/`Bạn bè` chuyển nội dung; `Trả lời` điền composer; nút `Gửi` phản hồi theo trạng thái nhập.
- Quick link `Tiếp tục Listening` điều hướng tới `/listen` và hiển thị trạng thái Listening Lab có nút dashboard/quay lại.
- Mobile ẩn desktop navigation và hiển thị vùng `Khu vực học`; dashboard vẫn đọc được đầy đủ qua accessibility tree.
- Mobile `Cài đặt` mở panel mục tiêu mặc định; nav `Nghe` điều hướng tới `/listen`.
- Các route learner/admin-facing placeholder hiện tại đều có màn hình hướng dẫn thay vì dead link/404: `/listen`, `/read`, `/write`, `/vocabulary`, `/mock-test`, `/video`, `/hoi-dap`, `/leaderboard`, `/upgrade`, `/account`.

## Automated checks

- `npm run typecheck` — pass
- `npm test` — pass (1 test)
- `NUXT_IGNORE_LOCK=1 npm run build` — pass

## Ghi chú

Phase 5 là app shell và design system. Nội dung học thật, API wiring và admin workflows được triển khai ở Phase 6–7; placeholder routes ở trên là chủ ý để mọi điểm điều hướng hiện tại vẫn có feedback hợp lệ.
