Build the club application review queue — where a union reviewer sees pending `ClubApplication` submissions for their institution and approves or rejects them, exactly as one combined decision covering both the club and its proposed admin.

## Route

Fill in real content for the existing `/union/applications` placeholder route from `08-union-dashboard-shell.md` — don't recreate the route, replace its content.

## Queue List

Show all `ClubApplication` rows for the active institution with status `PENDING`, most recent first. Each list item shows: club name (pull from the `answers` JSON — it's always present since it's a required seeded field), submitted date, and a "Review" action.

## Review View

Clicking an application opens a detail view (a `Dialog` or a dedicated sub-route, your choice) showing:

- every field from `schemaSnapshot`, in order, with its answer from `answers` — read-only, labeled exactly as the schema had it at submission time. Build a small read-only renderer for this (`components/forms/answer-summary.tsx`) — this is distinct from `dynamic-form.tsx` from `07-club-application-flow.md`, which is for editable input, not display.
- the resolved `proposedAdminEmail`
- two actions: **Approve** and **Reject**

## Approve Flow

Approving requires one additional input first: a **baseline budget amount** (number, required) — this is the union setting the club's starting budget as part of approval, per `architecture-context.md`. Show this as a small form within the approve confirmation (don't make it a separate step).

On confirm:
0. Atomically claim the `ClubApplication` by conditioning a status update on `PENDING` (for example an `updateMany` or transactional check). If this claim fails because another request already changed the status, abort without creating a Clerk organization or invitation.
1. Create a Clerk Organization for the new club (name from the application's answers).
2. Invite `proposedAdminEmail` to that org with the admin role, using Clerk's organization invitation flow — this works whether or not that email already has a Clerk account.
3. Create the `Club` record: `institutionId`, the new `clerkOrgId`, `approvalStatus: APPROVED`, the baseline budget amount entered above.
4. Update the `ClubApplication`: `status: APPROVED`, link `resultingClub` to the new Club record.
5. All four of the above must succeed together — if org creation succeeds but the Club record fails to save (or vice versa), this is exactly the failure mode `architecture-context.md`'s invariants warn about. Wrap what can be wrapped in a Prisma transaction, and for the Clerk API calls that can't be part of that transaction, add cleanup logic: if a later step fails, attempt to delete the Clerk org that was just created rather than leaving an orphaned one.

## Reject Flow

Simple confirmation (destructive-styled, matching the pattern from earlier dialogs). On confirm: `ClubApplication.status = REJECTED`. No Clerk org, no Club record. No applicant-facing notification yet — that's Trigger.dev work, later spec; for now the status change alone is the outcome.

## API

- `GET /api/union/applications?status=PENDING` — scoped to active institution via `lib/institution-scope.ts`
- `POST /api/union/applications/[applicationId]/approve` — body: `baselineBudgetAmount`. Performs the full sequence above.
- `POST /api/union/applications/[applicationId]/reject`

Both mutation routes must verify the application belongs to the reviewer's active institution before acting — never trust the `applicationId` alone.

## Scope Limits

- don't build applicant-facing status checking ("my applications") — still out of scope per `07`'s scope limits
- don't send real emails/notifications on approve or reject — status change only, for now
- don't build event or funding queues — that's `10` and `11`

## Check When Done

- pending applications for the active institution list correctly, and only for that institution (verify by checking a second institution sees none of the first's applications)
- review view renders the schema snapshot accurately, not the live/current schema if it's since changed
- approving creates a working Clerk org + Club record + invites the right email, and updates the application status + link
- a deliberately-forced failure partway through approval doesn't leave an orphaned Clerk org behind
- rejecting updates status only, no side effects
- `npm run build` passes