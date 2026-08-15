Build club-side budget tracking: categories with allocated amounts, income/expense entries (optionally linked to a category and/or event), receipt uploads on expenses, and running totals — per `architecture-context.md`'s `BudgetCategory`/`BudgetEntry` models.

## Route

`/budget` (flat, session-based, same pattern as `/events` and `/team`). Protected by `lib/org-scope.ts`.

## Categories

A simple management section: list of `BudgetCategory` rows (name, allocated amount), with add/edit/delete. Any club member can view, create, and edit. Deletion is Club Admin-only because it removes part of the club's financial structure; enforce this in the API and hide the control for non-admins.

## Entries

A list of `BudgetEntry` rows, each showing: type (income/expense badge), amount, category (if set), linked event (if set), date, note. Add-entry form:

- amount, type (income/expense), date, optional note
- optional category picker (from the club's own categories)
- optional event picker (from the club's own events — reuse whatever event-fetching pattern already exists from the board/calendar, don't re-derive)
- **receipt upload, expense entries only**: per `architecture-context.md`, upload to Vercel Blob at `receipts/{clubId}/{budgetEntryId}/{filename}` with `access: "private"`, store the resulting URL(s) in `BudgetEntry.receiptUrls`. Since the entry needs to exist to have an ID for the path, create the entry first, then upload and update `receiptUrls` — don't try to upload before the row exists. Receipts can contain sensitive financial documents, so reads need the same scoping as writes: the stored URL is not a publicly fetchable link — serve it through an authenticated download route (scoped by `entryId`) that re-checks the requester's active club owns the entry before streaming the blob back, rather than a bare `<a href>` to the Blob URL.
- income entries: no receipt field shown at all, not just hidden/disabled

## Running Totals

- per-category: a signed net total of entries linked to that category — income adds, expense subtracts
- overall: the same signed net total (income adds, expense subtracts) across every entry for the club, plus the separate income sum and expense sum it's built from — surface all three (income, expenses, net) rather than only the combined net figure, so a club can tell at a glance how much of the net came from each side
- Show the overall net total alongside `Club.availableBudgetAmount` (the cumulative union-approved budget, per `11-funding-request-queue.md`) as a "remaining" figure (`availableBudgetAmount + net`) so a club can see spend-vs-available at a glance. Don't build any automated flagging here — that's `12`'s job.

## API

- `GET/POST /api/budget/categories`, `PATCH/DELETE /api/budget/categories/[categoryId]` (DELETE is Admin-only)
- `GET/POST /api/budget/entries`, `PATCH/DELETE /api/budget/entries/[entryId]` (DELETE is Admin-only)
- A separate upload endpoint or server action for receipt files, scoped to a specific entry, verifying club ownership before accepting the upload

All routes verify the category/entry/event belongs to the requester's active club, same ownership pattern used everywhere since `06`.

## Scope Limits

- don't wire this into `12`'s overspend logic — flag the upgrade idea, don't build it
- don't add budget reporting/charts — running totals as plain numbers are enough for this spec
- don't add multi-file drag-and-drop upload polish — a basic file input is fine, this isn't a UI-heavy spec
- keep viewing, creating, and editing categories/entries open to all members; only the two destructive DELETE actions are Admin-only

## Check When Done

- categories can be created, edited, deleted
- entries can be created with all optional fields, correctly linked when set
- receipt upload works end-to-end: file lands in Vercel Blob, URL is stored, and is viewable/downloadable from the entry
- income entries never show a receipt upload field
- per-category and overall totals compute correctly (verify with entries on both sides — income and expense — not just expenses)
- the overall total displayed alongside `Club.availableBudgetAmount` is accurate
- `npm run build` passes
