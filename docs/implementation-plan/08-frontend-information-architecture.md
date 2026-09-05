# Frontend information architecture và feature plan

## 1. App shell

Desktop dùng top navigation theo discovery: Nghe, Đọc, Viết, Từ vựng, Đề thi, Video, Cộng đồng, Leaderboard, More, Nâng cấp, theme, notifications, account. Mobile chuyển nhóm chính thành bottom/compact nav; More chứa Blog/About/Feedback/Đề xuất/Account.

Session layer xử lý access token refresh, logout khi revoke, offline draft và global notification count. Entitlement layer trả `free|pro|premium` để component hiển thị gate thống nhất.

## 2. Feature slices

### Dashboard

Score controls, target presets, exam date picker, streak/XP, date range, activity cards, daily goals, continue-learning recommendation, PWA install prompt, chat dock.

### Listening

Catalog by type/level/dictation; Part 1–4; topic/level cards; progress/wrong/note/vocab actions; practice runner with audio, speed, replay, transcript/dictation, hint, flip, report, note and keyboard shortcuts.

### Reading

Practice Part 5–7; grammar topic/bank/difficulty/progress; bilingual article; English/Vietnamese toggle; passage question navigation; explanation, note, wrong and vocabulary save.

### Vocabulary

Set/topic filters; view words; flashcard/quiz/type/pronounce modes; SRS rating; Word Blast/Word Match; my vocabulary sources; create learning set/custom set; algorithm explanation and review queue.

### Mock exams

Test catalog, practice vs exam choice, time/part selection, timer, question palette, bilingual/annotator/fill/flip/auto/SFX controls, marking/review, answer/explanation, history/progress/scoring.

### Video

Playlist/chapters/lessons, search, expand groups, YouTube player, progress completion, locked content messaging.

### Writing

Picture/email catalog, filters, prompt runner, word count, sample answer, community, report, vocabulary, AI grade, credits, translation practice. Essay Part 3 release placeholder with notify CTA.

### Community/leaderboard

Feed filters/composer/tags/attachments, post detail/comment/reaction/share/follow/friend/report; chat dock; leaderboard metric/period, rank delta, Hall of Fame, referral share.

### Account/commerce

Profile/password/devices/notifications, referral stats/policy/withdrawal/ideas, plan comparison/upgrade, order states, feedback/proposal forms and legal pages.

## 3. State model

Every async screen has `idle/loading/success/empty/error/offline`. Practice runner additionally has `ready/answering/submitting/revealed/completed`. Admin editor has `draft/saving/dirty/validation-error/review/published/locked`.

## 4. Data/query policy

- route-level data fetched server-side where SEO/public content matters;
- authenticated study data fetched client-side with query cache and optimistic progress;
- never cache private signed URLs longer than their TTL;
- invalidate dashboard projections after attempt/session/goal mutations;
- preserve query params when switching tabs/modes for shareable references.
