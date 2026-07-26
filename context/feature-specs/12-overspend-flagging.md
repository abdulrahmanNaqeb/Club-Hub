Build overspend detection: a background job that flags any club whose tracked spend exceeds everything the union has ever approved for them, surfaced in the union dashboard for reconciliation. This is the first spec that touches Trigger.dev.

## What "Overspend" Means Here

A club's *approved* total is `Club.baselineBudgetAmount` (per `11-funding-request-queue.md`, this is cumulative — baseline plus every approved funding request). A club's *spent* total doesn't exist as a concept yet — `BudgetEntry` (income/expense tracking) is a later spec (`17`) that doesn't exist yet either.

Given that, this spec builds the flagging *mechanism* now, using the one real signal that does exist today: compare `Club.baselineBudgetAmount` against the sum of all `FundingRequest.amount` where status is `APPROVED`, for a sanity check that the running total is internally consistent (catches bugs like a missed/duplicated increment, not real overspending yet — real overspending requires `BudgetEntry`, which isn't built). Structure the job so that plugging in real expense-sum-based overspend detection later (once `17` exists) is a small change, not a rewrite: isolate "compute a club's current spend/flag status" into one function, `lib/compute-overspend-status.ts`, that the job calls — don't inline the logic into the Trigger.dev task itself.

Flag explicitly in `progress-tracker.md`: this spec is intentionally a placeholder mechanism ahead of its real data dependency (`17-budget-categories-entries.md`). Don't let this read as "overspend detection is done" — the plumbing is done, the real signal isn't wired yet.

## Trigger.dev Setup

Install and configure Trigger.dev per their current Next.js integration docs (check their docs directly — don't assume specifics from training data, their setup process changes). At minimum you'll need: the SDK installed, a `trigger.config.ts`, an API key in `.env`, and a way to run the local dev worker alongside `next dev`.

## The Job

Create `trigger/check-overspend.ts`: a scheduled task (daily is reasonable for now — don't over-engineer the schedule) that:
1. Fetches every `Club` with `approvalStatus: APPROVED`.
2. For each, calls `computeOverspendStatus(club)`.
3. If flagged, upsert an `OverspendFlag` record (new model — add to `prisma/models/club.prisma`: club relation, `flaggedAt`, `resolvedAt` nullable, unique constraint so a club can't have multiple simultaneous open flags — re-running the job shouldn't create duplicates for an already-flagged club).

## Union Dashboard Surface

Add a simple "Overspend Flags" section to the existing `/union/applications` page (or a new small section — your call on placement, but don't create a whole new sidebar nav item for this yet, it's a small addition to an existing view) showing any club with an unresolved `OverspendFlag`, club name, flagged date. A "Mark resolved" action sets `resolvedAt`.

## Scope Limits

- don't build real expense tracking — that's `17`, this spec explicitly can't do real overspend detection without it
- don't add email/notification delivery for flags — visual dashboard surfacing only
- don't over-build the scheduling — daily, simple, no configurable schedule UI

## Check When Done

- Trigger.dev is installed and the dev worker runs alongside `next dev`
- `check-overspend` runs on schedule (or can be manually triggered for testing) without erroring
- `computeOverspendStatus` is isolated in its own file, not inlined in the task
- flags surface in the union dashboard with a working "Mark resolved" action
- re-running the job doesn't create duplicate flags for the same club
- `progress-tracker.md` clearly notes this is placeholder logic pending `17`
- `npm run build` passes