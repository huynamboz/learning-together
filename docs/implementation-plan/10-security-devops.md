# Security, operations và deployment plan

## 1. Environments

`local`, `test`, `staging`, `production`; mỗi environment có DB/Redis/storage prefix riêng. Staging dùng sanitized seed. Migration forward-only, backup trước migration production.

## 2. Configuration

Typed config fails fast khi thiếu required env. Nhóm config: app URLs, DB, Redis, auth secrets, OAuth, storage provider/credentials, AI, payment, email/push, observability. `.env` chỉ local ignored; production dùng secret manager.

## 3. Auth/security baseline

- password hashing Argon2id;
- refresh token hash trong DB, rotation và reuse detection;
- CSRF strategy nếu cookie auth; strict CORS allowlist;
- secure/httpOnly/sameSite cookie hoặc token storage không để lộ XSS;
- Helmet, rate limit, body/file limits, validation whitelist;
- CSP cho YouTube/embed và media;
- encryption at rest/transport, key rotation;
- audit cho admin, billing, entitlement, moderation, storage.

## 4. Privacy/retention

Data export/delete workflow theo policy đã quan sát; soft-delete trước purge; anonymize community/analytics khi xóa tài khoản; retention riêng cho invoice/audit/ledger. AI input/output có retention và consent/notice rõ, không đưa secret hoặc PII thừa vào prompt.

## 5. Observability

Dashboard metrics: request rate/error/latency, DB pool, Redis, queue depth/failure, upload bytes/failure, grading latency/cost, payment webhook lag, active users. Alert theo SLO, không alert noise. Logs JSON có requestId/userId hash/role, không log token, password, signed URL hoặc bank data.

## 6. Delivery

Docker multi-stage, health/readiness probes, graceful shutdown, rolling deploy. Worker scale độc lập API. CDN cho public static; private learning assets signed. Feature flags cho Writing Part 3, AI grading, payment và provider migration.

## 7. Recovery

Automated DB backup + restore rehearsal; object storage versioning/lifecycle; Redis rebuildable; queue retry/dead-letter; runbook cho provider outage (switch provider/fallback local chỉ khi policy cho phép), payment reconciliation và corrupted import rollback.

## 8. Credential handling

R2 secret đã được cung cấp trong hội thoại không được sử dụng trực tiếp trong command/log/source. Trước production phải rotate; cấp key scoped đúng bucket/actions cần thiết; dùng separate keys cho local/staging/prod và revoke key cũ sau cutover.
