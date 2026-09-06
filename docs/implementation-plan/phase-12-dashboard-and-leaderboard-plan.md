# Phase 12 — Learner dashboard and leaderboard plan

## Mục tiêu

Thay dashboard tĩnh và leaderboard lộ UUID bằng snapshot tiến độ có thể hành động. Dashboard chỉ tổng hợp tín hiệu server đã ghi nhận; không tự dựng streak, XP, điểm hoặc “đã hoàn thành” để làm đẹp giao diện.

## API contract

| Contract | Quyền | Response / invariant |
| --- | --- | --- |
| `GET /learning/dashboard` | Authenticated | Snapshot cho đúng owner: accuracy attempts, thời lượng học hôm nay, SRS cards đã review, mock result gần nhất, XP, streak, hoạt động gần đây và progress theo daily target default. |
| `GET /learning/progress` | Authenticated | Giữ contract số attempt hiện tại; có thể dùng ở surface nhỏ, không bị thay bởi dashboard. |
| `GET /leaderboard/xp?limit=` | Public | Mỗi row chỉ trả `rank`, `displayName`, `xp`; tuyệt đối không lộ UUID/email. User chưa có XP không được bịa row demo. |

`today` dùng UTC trong phase này vì User chưa có timezone preference. API response ghi rõ `dayStart` (ISO) để client không diễn giải sai; per-user timezone là work tiếp theo khi thêm account settings.

## Snapshot design

```text
QuestionAttempt ─┐
StudySession ───┼─> GET /learning/dashboard ─> metric tiles + today goals + next action
SrsCard ─────────┤
ExamResult ──────┤
XpLedger ────────┤
WritingSubmission ┘

XpLedger ─> grouped XP + User.displayName ─> public leaderboard
```

- `accuracy`: count toàn bộ `QuestionAttempt` của owner; zero attempt có `accuracy=0`, không chia cho 0.
- `today`: sum study seconds theo `surface`, count attempts từ day start, `SrsCard.lastReviewedAt`, completed mock question/result nếu có. Daily target display là explicit default: 30 reading attempts, 30 phút listening, 20 cards, 40 mock questions, 20 phút video.
- `streak`: dedupe UTC dates có study session/attempt trong 60 ngày, walk backwards từ hôm nay. Không kéo streak từ “last login”.
- `recentActivity`: union được normalize bằng server từ session, attempt, SRS review và mock result; sort timestamp desc, bounded 8. Chỉ trả label/quantity/time cần render, không trả raw answer hoặc writing body.
- `nextAction`: deterministic, không AI: ưu tiên SRS due count > 0, sau đó chưa có listening time hôm nay, rồi chưa có reading attempts, cuối cùng một CTA ôn mock. Lý do/surface/link được API trả rõ để UI không duplicate logic.
- `xp`: sum ledger của owner (zero nếu chưa phát sinh). Phase này snapshot chỉ report XP vì current mutation paths chưa award XP consistently; award policy là phase sau.

## Leaderboard privacy + ordering

- `LeaderboardService` group XP first, batch lookup display names for user IDs. Không `N+1`; deleted/missing user fallback `Người học Đậu TOEIC`.
- Sort primary `xp DESC`, secondary `userId ASC` để rank stable với tie. Result public has no email/id.
- Empty ledger returns `[]`; frontend uses honest empty state and explain first study action, not hard-coded “Bạn”/fake competitors.

## Frontend interaction plan

- Homepage authenticated: `StudyTrail`, metric tiles, `GoalBoard`, `ActivityTimeline`, quick link details all bind snapshot. A concise loading state avoids metric jumping; API failure uses “chưa đồng bộ được” and preserves useful navigation, never placeholder score.
- Homepage logged out: same visual shell but cards explicitly invite login; no personal claims.
- Goal bars use `min(achieved / target, 100)`, numerals have accessible labels, and each goal links to the recommended relevant surface.
- Timeline is an event feed plus a separate deterministic “Bước tiếp theo” card, so the next action remains visible even if there is no history.
- Leaderboard maps `displayName` returned by API. It has a loading state and a no-XP state; no raw internal identifier reaches browser.

## Verification gate

1. Unit tests: dashboard zero data, aggregates/UTC streak/recommendation priority and owner scope; leaderboard names/fallback/stable rank/no user id.
2. Backend lint/typecheck/test/build; frontend typecheck/test/build.
3. Browser E2E desktop: authenticated learner sees actual recent listening/writing/SRS/mocks data and links; public leaderboard has display names only; logged-out dashboard makes no fake claim.
4. Mobile at `390 × 844`: dashboard metric grid, target bars, timeline and leaderboard do not overflow; keyboard focus reaches all actions.
5. Write Phase 12 verification log and commit atomically after gates pass.

## Scope boundaries

- This does not add account timezone/profile goals persistence, XP award policy, push reminders, social follows or real-time leaderboard updates.
- The existing `DailyGoal` schema is not written in this phase; it will become the persistence layer when goal configuration UI and user timezone arrive. Until then snapshot targets are explicit server defaults rather than silently half-synced DB records.
