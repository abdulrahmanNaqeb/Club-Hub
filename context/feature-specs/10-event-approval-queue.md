Build event approval: a club member submits an event for union approval, and a union reviewer approves/rejects it — separate from any funding request, per the institution's EVENT_APPROVAL form schema.

## Club-Side Submission

There's no real Events board yet (that's a later spec) — build a minimal standalone submission route for now: `/events/request-approval`, protected by `lib/org-scope.ts` (any club member, not just admin, can submit).

Reuse `dynamic-form.tsx` and `getOrSeedFormSchema` (from `06`/`07`) to render the active institution's EVENT_APPROVAL schema — resolve the institution via the club's `institutionId`. Same validation pattern as `07-club-application-flow.md`.

On submit: create an `EventApprovalRequest` — club relation, `answers`, `schemaSnapshot`, status `PENDING`. Redirect to a simple confirmation message. No "my requests" list yet for the submitter — out of scope, same reasoning as `07`.

## Union-Side Review

Fill in real content for the existing `/union/events` placeholder from `08-union-dashboard-shell.md`.

List all `EventApprovalRequest` rows with status `PENDING` **across every club in the active institution** — this is the first queue where you're aggregating across multiple clubs, not just one. Show club name (join through the `Club` relation) alongside each request so a reviewer knows who's asking.

Reuse `answer-summary.tsx` from `09` for the read-only detail view — same pattern, different schema.

Two actions: **Approve** and **Reject** — no extra input required for approve this time (unlike `09`'s baseline budget step; event approval doesn't touch money at all).

## Approve Flow

On confirm:
1. Create the `Event` record: club relation, title (pull from the submitted answers — assume a field with a sensible key like `eventName` exists in the schema, same reserved-field pattern as `07`'s `proposedAdminEmail` — add a `EVENT_NAME_FIELD_KEY` constant to `lib/form-schema-defaults.ts`), date/location/description from answers where present, status `CONFIRMED`.
2. Update `EventApprovalRequest`: status `APPROVED`, link `resultingEvent`.

Note for whoever builds the Events board later (`14-events-board.md`): right now, approval always creates a brand-new `Event`. Once the board exists and clubs can create `IDEA`/`PLANNING` events themselves before ever requesting approval, this flow will need reconciling — either the submission form lets a club link an existing Event instead of always creating one. Flag this explicitly in `progress-tracker.md` as a known integration point, don't silently solve it now.

## Reject Flow

Same pattern as `09` — simple destructive confirmation, `status: REJECTED`, no Event created, no notification yet.

## API

- `GET /api/union/events?status=PENDING` — scoped to active institution, joined across all its clubs
- `POST /api/events/request-approval` — club-scoped, creates the request
- `POST /api/union/events/[requestId]/approve`
- `POST /api/union/events/[requestId]/reject`

Mutation routes verify the request's club belongs to the reviewer's active institution before acting.

## Scope Limits

- don't build the real Events board — still later
- don't touch funding — that's `11`
- don't add applicant-facing status tracking

## Check When Done

- a club member can submit an event approval request using the real institution schema
- the union queue shows pending requests from every club in the institution, correctly labeled by club
- approving creates a real `Event` and links it back correctly
- rejecting has no side effects beyond status
- cross-institution isolation holds (a second institution's reviewer sees none of this one's requests)
- `npm run build` passes