Build overspend detection: a background job that flags any club whose tracked spend exceeds everything the union has ever approved for them, surfaced in the union dashboard for reconciliation. This is the first spec that touches Trigger.dev.

## What "Overspend" Means Here

The current `Club.baselineBudgetAmount` aggregates the original baseline plus any approved funding requests, but because it is mutable it cannot serve as an immutable expected baseline for reliable discrepancy detection (missed or duplicated increments will be indistinguishable from legitimate changes). Instead of comparing a single mutable field, this spec recommends deriving the approved total from an immutable ledger of budget operations (e.g. an `InitialAllocation` row plus `ApprovedFunding` ledger rows) or maintaining an append-only journal of budget deltas. The overspend job should read from that immutable source or compute the approved total from immutable ledger rows.

Given `BudgetEntry` (expense tracking) is not yet implemented, this spec focuses on plumbing: build the flagging mechanism and the job infrastructure, but base any sanity checks on an immutable ledger or derived approved-total computation rather than trusting a single mutable `baselineBudgetAmount` field. Structure the job so plugging in real expense-sum-based overspend detection later (once `17` exists) is a small change, not a rewrite: isolate "compute a club's current spend/flag status" into one function, `lib/compute-overspend-status.ts`, that the job calls — don't inline the logic into the Trigger.dev task itself.

Flag explicitly in `progress-tracker.md`: this spec is intentionally a placeholder mechanism ahead of its real data dependency (`17-budget-categories-entries.md`). Don't let this read as "overspend detection is done" — the plumbing is done, the real signal isn't wired yet.

## Trigger.dev Setup

Install and configure Trigger.dev per their current Next.js integration docs (check their docs directly — don't assume specifics from training data, their setup process changes). At minimum you'll need: the SDK installed, a `trigger.config.ts`, a secret key in the repository's existing `.env.local` file or your deployment secret manager convention, and a way to run the local dev worker alongside `next dev`.

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