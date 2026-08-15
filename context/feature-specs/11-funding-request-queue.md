Build funding requests: a club submits a request for money (amount + reason, per the institution's FUNDING_REQUEST schema), and a union reviewer approves/rejects at the headline amount only — approval increases the club's tracked available budget.

## Club-Side Submission

Standalone route: `/budget/request-funding`, protected by `lib/org-scope.ts` and restricted to Club Admins using the current user's real Clerk organization membership role. Reuse `dynamic-form.tsx` and `getOrSeedFormSchema` against FUNDING_REQUEST.

On submit: create a `FundingRequest` — club relation, `amount` (pull from the schema using a reserved key, add `FUNDING_AMOUNT_FIELD_KEY` to `lib/form-schema-defaults.ts`, same reserved-field pattern as `07`/`10`), `answers`, `schemaSnapshot`, status `PENDING`. Confirmation screen, no "my requests" view — same scope limits as before.

## Union-Side Review

Fill in the `/union/funding` placeholder. Same list/join pattern as `10`'s event queue (across every club in the institution, showing `club.name` directly — no Clerk lookup, per the fix from `10`). Reuse `answer-summary.tsx`.

**This is the one place the spec is explicit about what NOT to show**: per `architecture-context.md`, funding review is headline-amount-only. Show the requested amount prominently, plus whatever else the schema captured (reason, etc.) — there is no itemized breakdown to show because none exists at this stage. Don't add anything that implies line-item scrutiny (e.g. don't build a receipts-preview here — receipts belong to `BudgetEntry`, created later, after money is actually spent, not at the request stage).

Two actions: **Approve** and **Reject**, same pattern as `10` — no extra input needed (unlike `09`, approval doesn't require entering a new number; the requested amount *is* the amount, though a reviewer should be able to see it clearly before confirming).

## Approve Flow

On confirm:
1. Increase `Club.availableBudgetAmount` by the requested `FundingRequest.amount`. This field starts with the baseline entered during club approval and then represents the cumulative union-approved budget.
2. Update `FundingRequest`: status `APPROVED`.

No `BudgetEntry` gets created here — a `FundingRequest` approval is money becoming *available* to the club, not money being *spent*. `BudgetEntry` (income/expense tracking) is a separate, later spec (`17`) for the club's own internal bookkeeping.

## Reject Flow

Same pattern as `09`/`10` — status `REJECTED`, no side effects.

## API

- `GET /api/union/funding?status=PENDING`
- `POST /api/budget/request-funding`
- `POST /api/union/funding/[requestId]/approve`
- `POST /api/union/funding/[requestId]/reject`

Same institution-ownership verification pattern as `10`.

## Scope Limits

- don't build `BudgetEntry`/receipts — later spec
- don't add itemized review UI — explicitly against the spec's intent
- the historical `Club.baselineBudgetAmount` naming mismatch was resolved in a later stability pass by renaming the stored cumulative field to `availableBudgetAmount`

## Check When Done

- a club member can submit a funding request using the real schema
- the union queue shows pending requests across all clubs in the institution with correct names
- approving increases the club's tracked budget by exactly the requested amount — verify by checking the number before and after in Prisma Studio
- rejecting has no budget side effects
- cross-institution isolation holds
- `npm run build` passes
