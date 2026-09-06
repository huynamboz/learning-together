# Phase 13 — Account Hub và Profile

## Scope

- Tách khu vực tài khoản thành `/hub` với các tab profile, đổi mật khẩu, thiết bị, thông báo và referral.
- Giữ `/account` làm cửa vào đăng nhập/đăng ký; sau khi đăng nhập chuyển về `/hub?tab=profile`.
- Thêm alias `/profile` để deep-link tới hồ sơ cá nhân.
- Dùng API hiện có cho user, dashboard, devices và notifications; không hiển thị số referral giả khi attribution/billing chưa có dữ liệu.
- Lưu tùy chọn nhắc thông báo ở browser hiện tại cho đến khi có API preference server-side.
- Visual pass theo hướng Duolingo: nền kem full-bleed, mint progress hero, CTA xanh XP, tab active dạng pill/đường dẫn và bỏ shadow dashboard.

## Acceptance

- [x] Profile hiển thị tên, email read-only, gói, ngày tham gia, điểm gần nhất, XP và streak.
- [x] Có thể cập nhật tên hiển thị qua `PATCH /users/me`.
- [x] Có form đổi mật khẩu qua `PATCH /users/me/password`, có validate xác nhận.
- [x] Có danh sách thiết bị và thao tác gỡ qua `DELETE /users/me/devices/:id`.
- [x] Có danh sách thông báo và đánh dấu đã đọc qua `PATCH /notifications/read-all`.
- [x] Header avatar và login flow dẫn tới Hub.
- [x] Referral có empty state trung thực; chưa coi attribution/commission là hoàn tất.
- [x] Route responsive theo layout một cột dưới breakpoint `lg`, navigation tài khoản giữ được các tab.

## Verification

- Frontend typecheck: pass.
- Frontend unit tests: pass, 2 files / 3 tests.
- Frontend production build: pass với `NUXT_IGNORE_LOCK=1` vì Nuxt dev server đang chạy ở port 3011.
- Frontend lint: chưa chạy được vì package hiện tại thiếu executable `eslint`; đây là gap tooling tồn tại trước phase.
- Browser desktop: đã đăng nhập QA local, mở `/hub?tab=profile`, chuyển qua password/devices/notifications/referral và xác nhận nội dung/URL.
- Browser responsive: layout dùng `lg:grid-cols` và mobile nav hiện có; cần tiếp tục kiểm tra viewport thiết bị thật trong release QA.

## Known follow-ups

- Tạo API và persistence cho notification preferences.
- Hoàn thiện referral code, attribution, commission ledger, withdrawal và share tracking.
- Bổ sung upload avatar nếu asset policy cho phép.
