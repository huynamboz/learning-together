# API contract plan

API prefix: `/api/v1`. JSON response dùng camelCase; pagination cursor-based cho feed/content, page-based chỉ dùng cho admin table. OpenAPI là nguồn sinh typed client cho Nuxt.

## 1. Auth/account

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
- `GET /auth/me`, `POST /auth/google`, password reset flow.
- `GET/PATCH /users/me`, `GET/PATCH /users/me/preferences`.
- `GET /users/me/devices`, `DELETE /users/me/devices/:id`.
- `GET /users/me/entitlements`, `GET /plans`.

## 2. Catalog/content

- `GET /catalog/listening?mode=&part=&level=`.
- `GET /catalog/reading?mode=&part=&level=&topic=`.
- `GET /catalog/vocabulary?tab=&setId=`.
- `GET /catalog/exams`, `GET /catalog/videos`, `GET /catalog/writing?part=`.
- `GET /lessons/:id`, `GET /questions/:id` chỉ trả answer/explanation theo context được phép.
- `GET /blog`, `GET /blog/:slug`, `GET /feedback`, `GET /legal/:slug`.

## 3. Study/progress

- `POST /study/sessions`, `PATCH /study/sessions/:id/end`.
- `POST /attempts` với idempotency key; `GET /attempts/wrong`, `GET /attempts/history`.
- `POST/GET/PATCH/DELETE /notes`, `POST/DELETE /saved-items`.
- `GET /dashboard`, `GET /dashboard/activity`, `GET/PATCH /dashboard/goals`.
- `POST /vocabulary/reviews`, `GET /vocabulary/review-queue`, `GET /vocabulary/progress`.
- `POST /vocabulary/games/:game/start`, `POST /vocabulary/games/:id/answer`.
- `POST /exam-sessions`, `PATCH /exam-sessions/:id/answers`, `POST /exam-sessions/:id/submit`, `GET /exam-sessions/:id/result`.
- `POST /writing/submissions`, `POST /writing/submissions/:id/grade`, `GET /writing/submissions/:id`.

## 4. Media/upload

- `POST /media/upload-sessions`: chọn provider theo server policy, trả upload instructions.
- `POST /media/upload-sessions/:id/complete`: verify checksum/object existence và finalize.
- `POST /media/upload-sessions/:id/cancel`.
- `GET /media/:id`, `DELETE /media/:id` chỉ cho owner/admin theo policy.

Cloud upload không đi qua API body nếu có thể; client upload thẳng bằng presigned URL, API chỉ cấp session và finalize. Local provider dùng multipart streaming tới API, không buffer toàn bộ file vào memory.

## 5. Social/commerce

- `GET/POST /community/posts`, `GET/PATCH/DELETE /community/posts/:id`.
- `POST /community/posts/:id/comments`, reactions, follow, report.
- `GET/POST /friends`, `GET /chat/threads`, WebSocket `/chat`.
- `GET /leaderboard?metric=&period=`.
- `GET/POST /feedback`, `GET/POST /proposals`.
- `GET /referrals`, `GET /affiliate/policy`, `GET /affiliate/commissions`, `POST /affiliate/withdrawals`.
- `POST /billing/checkout`, `POST /billing/webhooks/:provider`, `GET /billing/orders`.

## 6. Admin

- `GET /admin/overview`, `/admin/analytics/*`.
- CRUD `/admin/content/*`, `/admin/topics`, `/admin/tests`, `/admin/videos`.
- `POST /admin/imports`, `GET /admin/imports/:id`, `POST /admin/imports/:id/retry|publish|rollback`.
- CRUD `/admin/media`, provider health and storage usage.
- `/admin/users`, `/admin/users/:id/entitlements|devices|audit`.
- `/admin/moderation/reports`, actions and appeals.
- `/admin/billing/orders|credits|withdrawals`.
- `/admin/settings/feature-flags|quotas|notification-templates`.

## 7. API conventions

- `Idempotency-Key` bắt buộc cho mutation retryable.
- `If-Match`/version cho admin edit tránh ghi đè.
- cursor response: `{ items, nextCursor, hasMore }`.
- audit header: `X-Request-Id` do server tạo nếu client không gửi.
- file endpoint trả media id và status, không trả secret/presigned URL lâu hạn.
