Build club-side budget tracking: categories with allocated amounts, income/expense entries (optionally linked to a category and/or event), receipt uploads on expenses, and running totals — per `architecture-context.md`'s `BudgetCategory`/`BudgetEntry` models.

## Route

`/budget` (flat, session-based, same pattern as `/events` and `/team`). Protected by `lib/org-scope.ts`.

## Categories

A simple management section: list of `BudgetCategory` rows (name, allocated amount), with add/edit/delete. Any club member can view; keep create/edit/delete open to any member too, unless you have a strong reason to gate it to admins — this app hasn't gated budget actions by role anywhere else, so stay consistent.

## Entries

A list of `BudgetEntry` rows, each showing: type (income/expense badge), amount, category (if set), linked event (if set), date, note. Add-entry form:

- amount, type (income/expense), date, optional note
- optional category picker (from the club's own categories)
- optional event picker (from the club's own events — reuse whatever event-fetching pattern already exists from the board/calendar, don't re-derive)
- **receipt upload, expense entries only**: per `architecture-context.md`, upload to Vercel Blob at `receipts/{clubId}/{budgetEntryId}/{filename}`, store the resulting URL(s) in `BudgetEntry.receiptUrls`. Since the entry needs to exist to have an ID for the path, create the entry first, then upload and update `receiptUrls` — don't try to upload before the row exists.
- income entries: no receipt field shown at all, not just hidden/disabled

## Running Totals

- per-category: sum of entries linked to that category (income adds, expense subtracts)
- overall: sum of all entries for the club
- Show the overall total alongside `Club.baselineBudgetAmount` (the union-approved available budget, per `11-funding-request-queue.md`) so a club can see spend-vs-available at a glance. Don't build any automated flagging here — that's `12`'s job, and it currently uses a different, simpler comparison (approved `FundingRequest` sums vs. baseline) as a placeholder. **Flag in `progress-tracker.md`, don't build now**: once this spec exists, `12`'s overspend logic could be upgraded to compare real `BudgetEntry` expense sums against available budget instead of its current placeholder — that's a meaningful follow-up, not something to fold into this spec.

## API

- `GET/POST /api/budget/categories`, `PATCH/DELETE /api/budget/categories/[categoryId]`
- `GET/POST /api/budget/entries`, `PATCH/DELETE /api/budget/entries/[entryId]`
- A separate upload endpoint or server action for receipt files, scoped to a specific entry, verifying club ownership before accepting the upload

All routes verify the category/entry/event belongs to the requester's active club, same ownership pattern used everywhere since `06`.

## Scope Limits

- don't wire this into `12`'s overspend logic — flag the upgrade idea, don't build it
- don't add budget reporting/charts — running totals as plain numbers are enough for this spec
- don't add multi-file drag-and-drop upload polish — a basic file input is fine, this isn't a UI-heavy spec
- don't gate categories/entries by admin role unless you have a concrete reason to diverge from this app's existing pattern

## Check When Done

- categories can be created, edited, deleted
- entries can be created with all optional fields, correctly linked when set
- receipt upload works end-to-end: file lands in Vercel Blob, URL is stored, and is viewable/downloadable from the entry
- income entries never show a receipt upload field
- per-category and overall totals compute correctly (verify with entries on both sides — income and expense — not just expenses)
- the overall total displayed alongside `Club.baselineBudgetAmount` is accurate
- `npm run build` passes