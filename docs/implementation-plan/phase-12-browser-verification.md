# Phase 12 — Learner dashboard and leaderboard verification

Ngày verify: 2026-09-06 (Asia/Ho_Chi_Minh)

## Delivered

- `GET /learning/dashboard` returns owner-scoped aggregate: attempt accuracy, today study duration, SRS due/review count, latest mock result, Writing counts, XP sum, UTC streak, daily targets, recent activity and deterministic next action.
- Dashboard’s goals/timeline/metrics/quick links bind the snapshot. Signed-out state asks for login instead of asserting a personal score, streak or activity.
- Public XP leaderboard returns display name + XP/rank only. It does not expose user UUID/email and empty XP ledger renders an honest empty state.
- Homepage hero no longer hard-codes a learner name.

## Browser E2E — desktop

- Logged in as seeded learner, dashboard showed the stored data rather than placeholders: `100%` accuracy (`1/1`), latest mock score `990` (`1/1`), `3` SRS cards due, `1` graded Writing feedback, recent mock/SRS/reading activity and a vocabulary-first next action.
- Goal board rendered five server-defined default targets with actual `0 / target` values and direct links to the matching learning surfaces.
- Leaderboard loaded its real empty ledger state: no fabricated competitors, no raw UUID visible, clear message explains that no XP has been recorded yet.

## Responsive QA

- Chrome device metrics verified `/`, `/leaderboard`, `/listen` and `/admin` at `390 × 844`.
- For all four routes: `visualViewport.width = 390`, `documentElement.scrollWidth = 390`, `body.scrollWidth = 390`.
- Metric grid, goal bars, timeline, empty leaderboard and admin tabs remain inside the viewport; interactive links retain keyboard focus styling.

## Automated checks

- Backend `npm run lint` — pass.
- Backend `npm run typecheck` — pass.
- Backend `npm test -- --runInBand` — pass, 24 suites / 52 tests.
- Backend `npm run build` — pass.
- Frontend `npm run typecheck` — pass.
- Frontend `npm test` — pass, 2 suites / 3 tests.
- Frontend `NUXT_IGNORE_LOCK=1 npm run build` — pass.

## Known follow-up

- XP ledger has no consistent award policy yet, so the real leaderboard may be empty. Add idempotent XP awards at learning mutations in the next phase rather than inserting demo rows.
- Daily targets are server defaults and days use UTC. `DailyGoal` persistence, user timezone preference and goal editing require their own follow-up phase.
