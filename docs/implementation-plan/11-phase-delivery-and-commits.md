# Phase delivery, commit plan và acceptance checklist

## 1. Commit discipline

Mỗi phase phải kết thúc bằng:

1. chạy test gate của phase;
2. cập nhật docs/changelog/migration notes;
3. kiểm tra `git diff`, secret scan và build;
4. commit atomic với conventional message;
5. ghi commit hash và evidence vào phase log.

Không squash mất lịch sử phase. Không commit credential, `.env`, dump DB, upload sample chứa PII.

## 2. Commit sequence dự kiến

| Phase | Commit prefix | Evidence bắt buộc |
| --- | --- | --- |
| 0 Planning | `docs: define product and implementation plan` | docs index, route/domain/API/storage/design/test plan |
| 1 Foundation | `feat(api): establish nestjs foundation` | boot, migration, auth/RBAC, health, OpenAPI, CI |
| 2 Content/storage/admin | `feat(api): add content ingestion and storage abstraction` | adapter contract, upload/import/admin tests |
| 3 Learning | `feat(api): add learning and assessment domains` | scoring/SRS/progress/exam/writing tests |
| 4 Social/commerce | `feat(api): add social billing and account domains` | webhook/ledger/moderation/device tests |
| 5 FE foundation | `feat(web): establish nuxt design system and app shell` | responsive shell, tokens, a11y smoke, typed client |
| 6 Student FE | `feat(web): build learner experiences` | e2e critical learner flows, visual QA |
| 7 Admin FE | `feat(web): build admin operations console` | import/upload/moderation/billing e2e |
| 8 Release | `chore: harden and prepare production release` | full test report, security/perf/deploy evidence |

## 3. Acceptance checklist by major area

### Backend

- [ ] auth/session/device limits and entitlement gates;
- [ ] every discovered learning surface has catalog + runner + progress;
- [ ] immutable attempts/results and idempotent mutations;
- [ ] storage provider abstraction with S3/R2/local adapters;
- [ ] admin import/publish/media/moderation/billing/analytics;
- [ ] audit, rate limits, privacy and observability;
- [ ] unit/integration/contract/e2e evidence.

### Frontend

- [ ] route parity with discovery and legacy redirects;
- [ ] intuitive desktop/mobile navigation;
- [ ] interaction for every visible button, including loading/disabled/error;
- [ ] design tokens/components reused across pages;
- [ ] animation purposeful and reduced-motion safe;
- [ ] keyboard/focus/contrast/accessibility checks;
- [ ] visual review for no generic card-grid drift.

### Operations

- [ ] provider secrets managed outside repo and rotated;
- [ ] backup/restore and outage runbooks;
- [ ] CI/CD gates and rollback path;
- [ ] storage/orphan/queue/payment reconciliation jobs;
- [ ] admin can observe and recover failed operations.

## 4. Phase log template

```md
## Phase N — title
- Scope:
- Migration:
- Test command/result:
- Manual/e2e evidence:
- Known follow-ups:
- Commit:
```
