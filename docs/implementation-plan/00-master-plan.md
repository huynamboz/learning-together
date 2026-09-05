# Đậu TOEIC — Master implementation plan

## 1. Mục tiêu

Xây dựng lại Đậu TOEIC thành một nền tảng học TOEIC 4 kỹ năng có:

- trải nghiệm học cá nhân hóa, nhanh và có feedback rõ ràng;
- backend NestJS có domain model, quyền truy cập, tiến độ, gamification, cộng đồng và admin vận hành đầy đủ;
- frontend Nuxt 3 + Tailwind CSS responsive, trực quan, có animation có chủ đích và không mang cảm giác template/AI slop;
- hệ thống upload có thể đổi nhà cung cấp qua dependency injection: AWS S3, Cloudflare R2 hoặc lưu trực tiếp trên server;
- admin có thể nhập nội dung nhanh theo lô, preview, validate, publish, quản lý media và theo dõi hoạt động;
- unit/integration/e2e test đủ sâu trước khi release.

## 2. Nguồn yêu cầu

Các feature đã được quan sát ở website đang chạy được ghi trong [README discovery](../README.md) và các tài liệu 01–13. Những nhóm chức năng phải giữ trong bản dựng lại:

1. Dashboard: điểm hiện tại/mục tiêu, ngày thi, streak, XP, hoạt động và mục tiêu ngày.
2. Listening: Part 1–4, theo dạng bài, theo level, dictation, câu sai, ghi chú, giỏ từ và player luyện tập.
3. Reading: luyện Part 5–7, grammar theo chủ điểm/bank/level/progress và đọc song ngữ.
4. Vocabulary: bộ từ, flashcard, SRS, quiz, gõ từ, phát âm, Word Blast, Word Match, từ của tôi.
5. Mock test: full/listening/reading/theo part, thi thử, luyện tập, lịch sử, câu sai, ghi chú, giỏ từ.
6. Video: playlist, chương/bài, search, YouTube embed, tiến độ.
7. Writing: Part 1 Picture, Part 2 Email, AI grading credits, dịch Việt–Anh; Part 3 Essay roadmap.
8. Community: feed, bài hỏi đáp, comment, follow/friend, chat nhanh, XP/reputation.
9. Leaderboard: XP, time, streak, referrals theo ngày/tuần/tháng/tất cả.
10. Account: profile, password, devices, notifications, referral/affiliate, upgrade.
11. Content/support: blog, about, feedback, proposal, privacy, terms, PWA install.

## 3. Nguyên tắc kiến trúc

- API-first: backend công bố OpenAPI; Nuxt chỉ tiêu thụ API typed.
- Domain-first: mỗi module sở hữu rule và dữ liệu của mình, tránh service khổng lồ.
- Provider-agnostic: app chỉ biết `StorageService`, không biết AWS/R2/local.
- Secure by default: secret chỉ qua environment/secret manager; upload có allowlist, quota và authorization.
- Immutable history: kết quả test, điểm AI và ledger XP/credits phải audit được; không overwrite dữ liệu lịch sử.
- Idempotent: submit answer, grading, upload finalize, payment webhook và leaderboard aggregation đều có idempotency key.
- Progressive delivery: mỗi phase có acceptance criteria, test gate và commit riêng.
- Browser verification: sau mỗi phase frontend phải chạy runtime thật và kiểm tra E2E trong browser ở desktop/mobile; không xem build xanh là đủ.

## 4. Quyết định công nghệ mặc định

| Lớp | Quyết định |
| --- | --- |
| Backend | NestJS, TypeScript strict, REST + OpenAPI |
| ORM/database | PostgreSQL + Prisma migrations |
| Cache/queue | Redis + BullMQ |
| Auth | Email/password, Google OAuth, access token ngắn hạn + refresh token rotation |
| Storage | AWS S3 / Cloudflare R2 / local filesystem qua DI |
| Validation | DTO class-validator ở boundary, Zod cho import schema và shared parsing |
| Frontend | Nuxt 3, Vue 3, TypeScript, Tailwind CSS |
| Data fetching | TanStack Query Vue hoặc composable typed dựa trên generated OpenAPI client |
| Forms | VueUse + typed form composables; upload resumable khi provider hỗ trợ |
| Test | Jest/Vitest, Supertest, Playwright, Testcontainers |
| Observability | structured logs, request id, Sentry/OpenTelemetry-compatible tracing |
| Deploy | Docker, PostgreSQL managed, Redis managed, CDN/object storage tùy provider |

## 5. Thứ tự triển khai

### Phase 0 — Planning

Hoàn thiện bộ docs này, route map, domain model, API contract, storage contract, admin workflow, design system và test plan.

### Phase 1 — Backend foundation

Monorepo/tooling, config, database, auth, RBAC, audit log, error model, health check, OpenAPI và CI.

### Phase 2 — Content + storage + admin ingestion

Content model, media model, provider adapters, upload session/direct upload, import batch, admin CRUD, publish workflow.

### Phase 3 — Learning engine

Listening/reading/grammar/vocabulary/mock/video/writing, answer evaluation, progress, SRS, AI-credit ledger và dashboard aggregation.

### Phase 4 — Social, commerce và account

Community, chat, friends/follow, leaderboard, feedback/proposal, devices, notifications, referral/affiliate, upgrade/payment webhook.

### Phase 5 — Frontend foundation

Nuxt app shell, auth/session, route guards, tokens, responsive shell, query/cache, error/empty/loading states, component library.

### Phase 6 — Student frontend

Dashboard, all learning surfaces, player/test experiences, writing, vocabulary games, video, social/account.

### Phase 7 — Admin frontend

Admin dashboard, content table/editor, bulk import, upload manager, media library, moderation, users/billing/analytics.

### Phase 8 — Hardening và release

Test matrix, accessibility, performance, security review, migration rehearsal, backups, monitoring, deployment runbook.

## 6. Definition of Done chung

Một feature chỉ được xem là xong khi:

- API, authorization và validation đã có;
- success/empty/loading/error/offline states đã định nghĩa;
- unit test cho rule, integration test cho persistence và e2e test cho flow quan trọng;
- event/audit/analytics cần thiết đã được ghi;
- UI responsive, keyboard accessible, reduced-motion compliant;
- frontend phase đã được mở và verify trong browser với flow chính, responsive breakpoint, mọi trạng thái async và các nút tương tác;
- docs/API schema được cập nhật;
- CI pass và phase được commit bằng message thống nhất.

## 7. Quy tắc secret

Credential R2 người dùng cung cấp không được commit, không đưa vào markdown, screenshot, log hoặc bundle frontend. Chỉ tạo các biến placeholder như `STORAGE_R2_ACCOUNT_ID`, `STORAGE_R2_ENDPOINT`, `STORAGE_R2_ACCESS_KEY_ID`, `STORAGE_R2_SECRET_ACCESS_KEY`. Vì credential đã xuất hiện trong hội thoại, trước khi bật production cần rotate key và tạo key mới với quyền tối thiểu trên bucket `toeic-web`.
