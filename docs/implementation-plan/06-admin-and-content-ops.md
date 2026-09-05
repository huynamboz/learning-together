# Admin control plane và content operations

## 1. Nguyên tắc

Admin phải thao tác nhanh trên hàng trăm/nghìn câu nhưng vẫn có preview và audit. Mọi content mutation đi qua versioning và permission; không cho edit trực tiếp production data không có lịch sử.

## 2. Admin dashboard

KPI theo thời gian: DAU/WAU, active learners, completion, accuracy, retention, uploads, processing failures, AI credits/cost, storage, pending moderation, payment/refund/withdrawal. Có health status DB/Redis/storage/queues và recent audit events.

## 3. Content list

Bảng virtualized khi cần, filter kết hợp: type, part, level, topic, source, status, owner, updatedAt, missing media, validation state. Bulk actions: tag, move, archive, publish, unpublish, assign reviewer, export.

Mỗi row cần cho biết: title/short prompt, type, part/level, status, media health, attempt count, last edit, lock/version. Search full-text tiếng Anh/Vietnamese.

## 4. Editor theo loại

### Listening

Audio, transcript, translation, part, level, topic, answer/choices, explanation, keywords, replay/segment metadata.

### Reading/grammar

Passage, question stem, options, answer, explanation, translation, grammar topic, difficulty, source and related lesson.

### Vocabulary

Lemma, IPA, audio, meanings, POS, example EN/VI, tags, image, distractors, set membership, ordering.

### Exam

Test metadata, parts, time, question ordering, scoring map, practice/exam availability, answer explanations.

### Video/blog

YouTube/video ref, chapters, captions/description, thumbnail, category, visibility, lesson ordering, SEO metadata.

### Writing

Prompt, image, keywords, Vietnamese prompt, sample answer, rubric, time/word limit, AI grading policy and credit cost.

## 5. Import workflow

```text
Upload files → select schema → dry-run → validation report → fix/download errors
→ preview normalized records → duplicate check → save draft batch
→ reviewer approval → publish → post-publish health check
```

Supported import packages:

- CSV for question rows;
- JSON for nested passage/test/lesson structures;
- ZIP for CSV/JSON + media folder;
- optional API adapter for future external source.

Import requirements:

- schema version in file;
- deterministic external key for upsert;
- row-level error, not all-or-nothing opaque failure;
- dry-run never publishes;
- upsert requires explicit mode;
- report counts created/updated/skipped/failed/duplicate;
- media references resolve by filename/checksum;
- import batch can be paused, retried, canceled.

## 6. Review/publish

Workflow: editor saves draft → reviewer sees normalized preview and diff → reviewer approves/rejects with comment → publisher schedules or publishes. Publish validates required fields, answer uniqueness, media readiness, entitlement and no broken references. Schedule supports timezone and rollback version.

## 7. Moderation/admin safety

- separate content editor, moderator, billing and super-admin roles;
- sensitive actions require reason and audit;
- optional second approval for delete/publish/billing adjustment;
- PII redaction in admin lists;
- impersonation, if ever added, must be time-limited, bannered and audited.
