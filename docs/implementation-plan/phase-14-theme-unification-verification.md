# Phase 14 — Theme unification và learner home verification

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Scope delivered

Trước phase này, theme kiểu Duolingo (nền trắng, surface mint, CTA xanh lá có viền nhấn) chỉ tồn tại trong một khối `<style scoped>` khoảng 150 dòng của `/hub`. Các route còn lại vẫn dùng hệ ink navy, viền xám xanh và shadow.

- Đưa theme lên tầng chung: token trong `tailwind.config.ts` (`ink #263238`, `line #DCECDF`, thêm `grass`, `mint`, `sun`, `azure`, `blush`, `field`) và rule dùng chung trong `assets/css/main.css`.
- Thay hex rời rạc trong page/component bằng token có tên (`bg-[#E7F7F1]` → `bg-mint`, `bg-[#FFF6DF]` → `bg-sun`, `bg-[#E8F7FF]` → `bg-azure`, `bg-paper` → `bg-mint` ở vai trò surface phụ).
- Hai utility CTA rõ nghĩa: `.cta-grass` cho hành động cam kết, `.cta-sky` cho hành động điều hướng. Không dùng selector bao trùm `[class*="bg-ink"]` vì nó bắt nhầm cả surface lớn (flashcard từ vựng).
- `AppButton` primary/accent dùng token thay vì màu ink; `AppShell` đưa content width về `1320px` để thẳng hàng với top nav như `/hub`.
- `pages/hub/index.vue` giảm từ 383 xuống 296 dòng: chỉ còn layout riêng của hub, phần palette/surface/control dùng chung. Active tab bind bằng class `is-active` thay vì so khớp chuỗi class (`[class*="bg-mint"]` bắt nhầm cả `hover:bg-mint`).
- Home: `StudyTrail` được giữ surface riêng qua `.keeps-surface` (rule flatten hero chung không còn áp cho nó), có streak/XP chip, CTA gọi đúng tên hành động tiếp theo và trail 5 mốc. `MetricTile` chuyển từ 4 hộp trắng giống nhau sang 4 surface có màu theo tone. `ActivityTimeline` bỏ khối "bước tiếp theo" bị trùng lặp ba lần trên cùng một trang.

## Browser verification — Chrome DevTools MCP

Runtime: web `http://localhost:3011`, API `http://localhost:3010`. Seed lại bằng `npm run seed` với password truyền qua environment; đăng nhập bằng tài khoản seed `learner@dautoeic.local` và `admin@dautoeic.local`.

### Desktop `1440 × 900`

- `/`, `/listen`, `/read`, `/vocabulary`, `/mock-test`, `/write`, `/video`, `/hoi-dap`, `/leaderboard`, `/upgrade`, `/hub`, `/admin` dùng chung một hệ surface/viền/CTA.
- `/hub` giữ nguyên diện mạo trước và sau khi rút gọn style — so sánh screenshot trước/sau.
- `/admin` với token admin: content library 3 item, writing queue 2 bài, media library có asset `READY/public`; tab active, panel review và dropdown themed đều hoạt động.
- Home đã đăng nhập hiển thị dữ liệu thật (accuracy `100%` `1/1`, `3` thẻ SRS đến hạn, `1` feedback Writing). Home chưa đăng nhập hiển thị `—` và câu mời đăng nhập, không bịa số liệu.
- Console không có error/warning.

### Mobile `390 × 844`

12 route đều trả `visualViewport.width = 390`, `documentElement.scrollWidth = 390`, `body.scrollWidth = 390`; không có horizontal overflow.

### Regression đã phát hiện và sửa trong lúc verify

1. Rule `[class*="bg-ink"]` biến flashcard từ vựng thành một khối nút xanh lá. Đã thay bằng utility CTA gắn trực tiếp vào từng nút.
2. Selector active tab của hub bắt nhầm `hover:bg-mint`, làm mọi tab đều hiện nền xanh. Đã bind bằng class `is-active`.
3. Rule focus của input có specificity thấp hơn rule nền, nên viền focus không đổi màu. Đã nâng selector; đo lại `borderTopColor = rgb(139, 216, 94)`.
4. Home lặp nguyên văn nội dung next action ở ba chỗ. Hero giữ CTA gọi tên hành động, timeline trở lại đúng vai trò feed.

## Automated checks

- Frontend `npm run typecheck` — pass.
- Frontend `npm test` — pass, 2 file / 3 test.
- Frontend `NUXT_IGNORE_LOCK=1 npm run build` — pass.
- Frontend `npm run lint` — vẫn chưa chạy được do package thiếu executable `eslint`; gap tooling này có từ trước Phase 13.

## Known follow-up

- Icon của admin (`solar:library-bold`, `solar:chart-2-bold`, …) chưa được đăng ký trong `AppIcon`, nên đang fetch từ Iconify API lúc runtime. Nên vendor chúng như các icon còn lại để bỏ phụ thuộc mạng.
- `npm run lint` cần được khôi phục trước khi coi test gate là đầy đủ.
