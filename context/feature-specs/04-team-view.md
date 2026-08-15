Build the Team view (`/team`) using real Clerk organization data. No task/leaderboard persistence yet — member data is real, task/stat data is mocked.

## Before Starting

`lib/club-members.ts` already exists (built during `16-event-detail-checklist.md` for the event-assignee picker) — reuse it for fetching the club's real member list. Do not build a second Clerk-membership-fetching helper.

## Goal

Show the current club's members with role, mocked task counts, and a leaderboard. Let admins open Clerk's own member-management UI rather than building a custom one.

## Team Page

Server component. Layout:

- member list: avatar, name, role badge
- next to each member: a mocked "tasks done" count for now — replace with a real count once `EventTask` data is meaningful enough to aggregate from (a follow-up, not this spec)
- a "Manage Members" button, visible to admins only (check the current user's role from the membership list)
  - opens Clerk's `OrganizationProfile` component in a modal, scoped to the Members tab
  - do not build a custom invite/remove/role-change UI — this is exactly what `OrganizationProfile` already does

## Leaderboard

- same member list, sorted by the mocked task count, descending
- top 3 visually distinguished (e.g. subtle rank badge) — keep it understated, no confetti/gamified visuals per `ui-context.md`'s tone

## Check When Done

- Team page renders real club members via `lib/club-members.ts`, not mock data
- role badges reflect actual Clerk org roles
- non-admins do not see the "Manage Members" button
- "Manage Members" opens Clerk's own `OrganizationProfile`, not a custom dialog
- leaderboard sorts correctly by the mocked task count
- `npm run build` passes