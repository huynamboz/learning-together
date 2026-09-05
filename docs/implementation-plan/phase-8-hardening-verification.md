# Phase 8 — Hardening and runtime verification

Ngày verify: 2026-09-06 02:28 (Asia/Ho_Chi_Minh)

## Runtime

- Project API chạy tại `http://localhost:3010`.
- Project Web chạy tại `http://localhost:3011`.
- `GET /api/v1/health` trả `200` và CORS trả đúng `Access-Control-Allow-Origin: http://localhost:3011`.
- `GET /api/v1/content?type=LISTENING&part=1` trả `200`; database hiện chưa có published seed content nên body là `[]`.

## Account E2E

- Browser desktop: register user QA local → login → gọi `/users/me` → update display name → logout.
- Browser mobile: account page render responsive, form controls và navigation giữ accessibility tree hợp lệ.
- Access/refresh token chỉ lưu qua cookie client-side; không đưa credential storage vào source.

## Automated checks

- Backend `npm run typecheck` — pass
- Backend `npm test` — pass (13 suites, 23 tests)
- Backend `npm run build` — pass
- Frontend `npm run typecheck` — pass
- Frontend `npm test` — pass (2 suites, 3 tests)
- Frontend `NUXT_IGNORE_LOCK=1 npm run build` — pass
- Secret scan source/config/docs — không phát hiện credential R2 thật; chỉ còn tên biến placeholder và test fixtures.

## Known follow-ups

- Cần seed/import bộ content thật qua Admin console trước khi bật production.
- Cần cấu hình production secret manager, rotate R2 key đã từng xuất hiện ngoài repository, và set provider `r2`/`s3` theo môi trường.
- Swagger vẫn phát cảnh báo legacy route converter cho wildcard error route; không ảnh hưởng health/API route hiện tại, sẽ xử lý trong production hardening riêng.
