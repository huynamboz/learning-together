# Backend architecture — NestJS

## 1. Module boundaries

```text
apps/api
  src/
    app.module.ts
    common/                 # guards, pipes, filters, result/error, request context
    config/                 # typed env and provider configuration
    database/               # Prisma client, transactions, seed
    auth/                   # credentials, Google OAuth, sessions, recovery
    users/                  # profile, devices, preferences, entitlements
    access/                 # plans, permissions, feature gates, quotas
    content/                # courses, lessons, questions, explanations, publishing
    media/                  # asset metadata and storage orchestration
    imports/                # CSV/JSON/ZIP batch ingestion and validation
    learning/               # attempts, answers, progress, recommendations
    listening/
    reading/
    vocabulary/             # SRS, sets, games, mastered state
    exams/                  # mock tests, sessions, scoring, history
    videos/
    writing/                # prompts, submissions, grading jobs, credits
    gamification/           # XP, streak, goals, activity, leaderboard
    community/              # posts, comments, reactions, follows, reports
    chat/                   # realtime messages, friends/presence
    notifications/          # in-app, web push, email templates
    referrals/              # referral attribution and commission ledger
    billing/                # orders, payments, webhooks, refunds
    feedback/
    admin/                  # admin-only orchestration and dashboard queries
    audit/                  # immutable audit events
    health/
```

Không cho module gọi trực tiếp repository của module khác. Giao tiếp qua application service hoặc domain event. `content` sở hữu canonical question/lesson; `learning` sở hữu attempt/progress; `exams` sở hữu exam session/history.

## 2. Request pipeline

1. request id middleware;
2. structured logger + timing;
3. auth guard và session extraction;
4. role/entitlement/quota guard;
5. DTO validation + transform;
6. controller chỉ mapping request/response;
7. application service mở transaction khi cần;
8. domain event/outbox cho side effect;
9. exception filter trả error envelope ổn định.

## 3. Error envelope

```json
{
  "error": {
    "code": "CONTENT_NOT_PUBLISHED",
    "message": "Nội dung chưa được xuất bản.",
    "details": {},
    "requestId": "..."
  }
}
```

Code machine-readable dùng trong frontend; message tiếng Việt thân thiện nhưng không để lộ stack/secret. Validation trả field errors. Rate limit trả `RATE_LIMITED` + `retryAfter`.

## 4. Background jobs

BullMQ queues:

- `content-import`: parse, validate, deduplicate, materialize.
- `media-processing`: metadata, image resize, audio waveform/duration, virus scan.
- `grading`: writing/speaking AI grading, retry có backoff.
- `notifications`: push/email/in-app fanout.
- `leaderboard`: aggregate theo bucket ngày/tuần/tháng.
- `analytics`: rollup event học tập.
- `billing`: webhook reconciliation, affiliate settlement.

Mọi job có idempotency key, attempt counter, dead-letter state và admin retry.

## 5. Realtime

Chat/presence dùng WebSocket gateway; persisted message qua `chat` module, Redis adapter cho nhiều instance. Nếu WebSocket lỗi, UI fallback polling/inbox refresh. Không dùng realtime cho dữ liệu cần consistency cao như payment/progress commit.
