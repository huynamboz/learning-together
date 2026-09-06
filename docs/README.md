# Đậu TOEIC — Functional Discovery Notes

Tài liệu này ghi nhận các chức năng quan sát được từ website đang chạy tại [dautoeic.com](https://dautoeic.com/), phục vụ việc dựng lại sản phẩm học TOEIC.

## Phạm vi và cách ghi nhận

- Thời điểm quan sát: 2026-09-06.
- Nguồn: giao diện đang chạy, ở trạng thái đã đăng nhập.
- Đây là tài liệu reverse-discovery ở tầng sản phẩm/frontend; không đại diện cho source code backend, database hay API nội bộ.
- Các URL bên dưới là reference để mở lại đúng màn hình đã quan sát.

## Mục lục

- [Dashboard](./01-dashboard.md)
- [Luyện nghe](./02-listening.md)
- [Luyện đọc, ngữ pháp và đọc song ngữ](./03-reading.md)
- [Từ vựng](./04-vocabulary.md)
- [Đề thi thử](./05-mock-tests.md)
- [Video và lộ trình](./06-video.md)
- [Cộng đồng hỏi đáp](./07-community.md)
- [Leaderboard](./08-leaderboard.md)
- [Writing](./12-writing.md)
- [Dashboard, mục tiêu và chat nổi](./13-dashboard-chat.md)
- [Master implementation plan](./implementation-plan/00-master-plan.md)
- [Phase 9 — Operational data and browser verification](./implementation-plan/phase-9-operational-data-and-browser-verification.md)
- [Phase 10 — Content, engagement and learner-history plan](./implementation-plan/phase-10-content-engagement-plan.md)
- [Phase 10 — Content and engagement browser verification](./implementation-plan/phase-10-browser-verification.md)
- [Phase 11 — Media delivery and Writing review plan](./implementation-plan/phase-11-media-and-writing-review-plan.md)
- [Phase 11 — Media and Writing review browser verification](./implementation-plan/phase-11-browser-verification.md)
- [Phase 12 — Learner dashboard and leaderboard plan](./implementation-plan/phase-12-dashboard-and-leaderboard-plan.md)
- [Phase 12 — Learner dashboard and leaderboard verification](./implementation-plan/phase-12-browser-verification.md)
- [Tài khoản, gói học và affiliate](./09-account-and-monetization.md)
- [Blog, giới thiệu và feedback](./10-blog-about-feedback.md)
- [Pháp lý, footer và tương thích route](./11-legal-and-navigation.md)

## Điều hướng chính đã xác định

| Khu vực | Reference |
| --- | --- |
| Dashboard | [https://dautoeic.com/](https://dautoeic.com/) |
| Nghe | [https://dautoeic.com/listen](https://dautoeic.com/listen) |
| Đọc | [https://dautoeic.com/read](https://dautoeic.com/read) |
| Viết | [https://dautoeic.com/write](https://dautoeic.com/write) |
| Từ vựng | [https://dautoeic.com/vocabulary](https://dautoeic.com/vocabulary) |
| Đề thi | [https://dautoeic.com/mock-test](https://dautoeic.com/mock-test) |
| Video | [https://dautoeic.com/video](https://dautoeic.com/video) |
| Cộng đồng | [https://dautoeic.com/hoi-dap](https://dautoeic.com/hoi-dap) |
| Leaderboard | [https://dautoeic.com/leaderboard](https://dautoeic.com/leaderboard) |

## Trạng thái khám phá

Đã phủ các màn hình học chính, Writing, dashboard/chat, trang nội dung, cộng đồng, bảng xếp hạng, tài khoản, gói học, referral/affiliate, blog, giới thiệu, feedback, đề xuất và pháp lý. Nói đang được dashboard đánh dấu “Sắp ra/Đang phát triển”; chưa xác minh được flow luyện Nói.

## Implementation planning

Bộ planning nằm trong [docs/implementation-plan](./implementation-plan/00-master-plan.md), gồm requirements/route map, backend architecture, domain model, API contract, storage abstraction, admin operations, design system, frontend IA, testing, security/devops và phase/commit checklist. Các phase đã triển khai có browser verification riêng; log mới nhất là [Phase 9](./implementation-plan/phase-9-operational-data-and-browser-verification.md).

## Ghi chú triển khai

Khi dựng lại, nên coi các route và nhãn UI trong tài liệu là contract sản phẩm ban đầu. Các chi tiết dữ liệu, quyền PRO và trạng thái tiến độ cần được xác minh thêm ở các màn hình tương ứng.
