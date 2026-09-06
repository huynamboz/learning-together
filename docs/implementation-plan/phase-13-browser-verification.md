# Phase 13 — Browser verification

## Desktop evidence

- URL: `http://localhost:3011/hub?tab=profile`
- Authenticated learner: profile card hiển thị `Người học demo`, email, gói FREE, XP, streak và số thông báo.
- `?tab=password`: hiện đủ ba ô mật khẩu và CTA đổi mật khẩu.
- `?tab=devices`: hiện empty state hợp lệ khi tài khoản chưa có device record.
- `?tab=notifications`: hiện bốn tùy chọn nhắc, danh sách notification và CTA đánh dấu đã đọc.
- `?tab=referral`: hiện empty state referral, không tạo số liệu giả và liên kết sang upgrade.
- Visual review: nền kem phủ full-bleed, hero mint với thanh tiến bộ xanh/vàng, surface phẳng và CTA xanh XP; không còn hệ card xám + shadow dày.

## Responsive review

- Hub chuyển từ sidebar + content sang một cột dưới `lg`.
- Header đã có nav ngang cuộn ở breakpoint nhỏ; các form dùng width co giãn và field không overflow.
- Cần thêm một pass viewport 390px/768px bằng browser automation trước release sign-off.
