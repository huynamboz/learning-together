# Testing strategy và quality gates

## 1. Test pyramid

### Unit

NestJS services/domain rules: entitlement, scoring, answer normalization, SRS intervals, streak rollover/timezone, XP/leaderboard aggregation, affiliate tiers, credit ledger, upload policy, import validators, route guards.

Vue composables/components: answer state machine, timer, dictation hint/flip, upload queue reducer, SRS rating, permission gates, form validation and keyboard behavior.

### Integration

Testcontainers PostgreSQL + Redis. Verify migrations, repositories, transaction rollback, outbox, queues, storage adapters, signed upload complete, exam submit idempotency, webhook reconciliation and permission boundaries.

### Contract

OpenAPI response/request snapshots; all storage adapters share contract suite; import schemas versioned; payment webhook fixtures per provider.

### E2E

Playwright against seeded environment:

1. register/login/refresh/logout and Google callback mock;
2. dashboard set goal/date/score and see projection;
3. listening play/answer/save wrong/note/vocab/complete;
4. reading bilingual/grammar answer/next;
5. vocabulary learn/rate SRS/play game;
6. mock practice and timed exam result/history;
7. writing submit AI grading with credit consume/retry;
8. community post/comment/report and chat fallback;
9. upgrade webhook entitlement;
10. admin import dry-run/fix/publish/upload/media retry/moderation;
11. local/cloud upload happy and failure paths;
12. mobile viewport and keyboard-only critical flows.

### Browser verification bắt buộc sau mỗi frontend phase

Sau Phase 5, 6 và 7, phải mở runtime bằng browser và ghi evidence trước khi commit:

- desktop viewport: navigation, primary flow, không bị cắt hoặc chồng nội dung;
- mobile viewport: responsive navigation, touch targets, không có horizontal overflow;
- keyboard-only: tab order, visible focus, Enter/Escape, form errors;
- visual states: loading, empty, disabled, success, API error, offline/retry;
- interaction audit: mỗi button/link/menu visible đều có hành vi đúng hoặc trạng thái “coming soon” rõ ràng;
- practice flow: answer, next, save, feedback, progress and return navigation;
- upload/admin flow: drag/drop, progress, cancel/retry, validation and publish preview.

Evidence gồm URL/runtime commit, viewport đã kiểm tra, screenshot hoặc browser notes, lỗi phát hiện và trạng thái đã sửa. Chỉ commit frontend phase sau khi manual browser verification và Playwright smoke cùng pass.

## 2. Security tests

- unauthorized IDOR on every user-owned resource;
- role escalation/admin endpoints;
- refresh token reuse detection;
- upload path traversal, MIME spoof, oversized body, malicious SVG/script;
- signed URL leakage/expiry;
- webhook signature/replay/idempotency;
- rate limits, brute force, chat spam, community XSS/HTML sanitization;
- PII redaction in logs and admin exports.

## 3. Performance gates

- API p95 targets by endpoint class: catalog <300ms cached, answer submit <500ms excluding async grading, admin import status <500ms;
- no unbounded query; cursor pagination and indexes checked with query plans;
- frontend LCP/INP/CLS budgets on dashboard/catalog;
- practice runner interaction remains responsive while audio/queue jobs run;
- upload uses streaming/direct path and does not increase API memory with file size.

## 4. Test data

Seed deterministic users for Free/PRO/Premium, admin/editor/moderator, sample each content type, wrong/correct history, timezone boundary, expired plan, failed upload, pending payment, moderation cases. Tests never use production credential or user data.

## 5. CI gate

`lint → typecheck → unit → integration → build → contract → e2e smoke`; nightly full e2e, mutation/property tests for scoring/SRS/ledger and dependency/security scan. A phase cannot be committed as complete if its required gate is red or skipped without an issue recorded.
