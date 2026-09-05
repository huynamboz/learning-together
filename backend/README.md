# Đậu TOEIC API

## Local run

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npm run start:dev
```

Nếu port `5432` hoặc `6379` đang được dùng, chạy `POSTGRES_PORT=15432 REDIS_PORT=16379 docker compose up -d` và đổi port trong `DATABASE_URL`/`REDIS_URL`.

API: `http://localhost:3010/api/v1`; Swagger: `http://localhost:3010/docs`; health: `GET /api/v1/health`.

Public content read: `GET /api/v1/content?type=LISTENING&part=1` or `GET /api/v1/content/:slug`.
Practice catalog: `GET /api/v1/practice/questions?kind=GRAMMAR&part=5` (never returns answer keys) and `GET /api/v1/mock-tests`.

## Local demo seed

Seed cần password admin qua environment, nên không có credential nào được commit:

```bash
SEED_ADMIN_PASSWORD='choose-a-long-local-password' SEED_LEARNER_PASSWORD='choose-a-second-long-local-password' npm run seed
```

Seed tạo admin, learner demo, public content, question, mini mock test, SRS cards, AI credits và community post để kiểm tra end-to-end.

## Storage

Mặc định `STORAGE_PROVIDER=local`. Với S3/R2, chỉ cấu hình secret qua environment/secret manager; browser chỉ nhận presigned URL, không nhận access key. Không commit `.env`.

## Verification

```bash
npm run typecheck
npm test -- --runInBand
npm run build
npx prisma validate
```
