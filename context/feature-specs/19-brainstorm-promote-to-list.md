Two things to do in this session, in order — fix the bug first, then build the new feature.

## Part 1: Bug fix — receipt upload not persisting

On the Budget page, uploading a receipt file in the "Edit entry" dialog (Receipts field, e.g. selecting IMG_2600.jpeg) and clicking "Save changes" does not result in the entry showing a receipt afterward — the Entries table's Receipts column still shows "—" instead of a link to the uploaded file.

Investigate and fix the actual root cause — likely candidates to check first:
- Is the file input's selected file actually being included in the form submission (check if it's using FormData correctly, or if the file state is being read at all when "Save changes" is clicked)?
- Is the upload endpoint (POST .../[entryId]/receipts, or wherever this was wired per 17-budget-categories-entries.md) actually being called at all during save — check the Network tab for the request, not just assume it fires?
- If the request does fire, does it succeed (check response status) and does the response actually get used to update BudgetEntry.receiptUrls?
- Confirm BLOB_READ_WRITE_TOKEN is being read correctly at runtime (it was only added recently) — check for any error being silently swallowed rather than surfaced to the user.

Reproduce it yourself against the real dev database if possible, fix the actual cause (not just add a generic try/catch that hides the symptom), then verify by actually uploading a file to a real expense entry and confirming it shows up both in the Entries table (a clickable receipt link/icon) and in the Vercel Blob dashboard's file browser.

## Part 2: New feature — 19-brainstorm-promote-to-list.md

Build "promote to list": a note on the Brainstorm canvas can be promoted into a structured, ranked list of ideas — separate from the freeform canvas space, per project-overview.md's original spec for this feature.

### Data

Use the existing BrainstormIdea model from 05-prisma.md (club relation, text, vote count). Promoting a canvas note creates a BrainstormIdea row with that note's text — the note itself can either stay on the canvas or be removed after promotion, your call, but be consistent and document which in the tracker (removing avoids the same idea existing in two places at once, which is probably the cleaner choice).

### UI

- On each note (from 18's canvas), add a "Promote" affordance (small button/icon on hover or select, same low-key treatment as the existing delete action).
- Below or alongside the canvas (your call on layout — a tab similar to Events' Board/Calendar split, or a side panel, whichever fits better given how 18's canvas is laid out), show the ranked list: each BrainstormIdea with its text and vote count, sorted by votes descending.
- Any club member can upvote an idea (simple click, one vote per member per idea — track this, don't let the same person inflate a count by clicking repeatedly).

### Data Model Addition

Add whatever's needed to track "who voted for what" to prevent double-voting — e.g. a join table or a simple array/JSON of voter Clerk user IDs on BrainstormIdea (a small addition; check 05-prisma.md's existing model first and extend it rather than assuming from scratch).

### Real-Time Scope

Per architecture-context.md, Liveblocks is scoped to exactly the canvas and the board — the promoted, ranked list itself is a normal Postgres-backed view, not a Liveblocks room. A page reload showing an updated vote count is fine; this doesn't need to feel as instantaneous as the canvas.

### API

- POST /api/brainstorm/ideas — body: { text } (called when promoting)
- POST /api/brainstorm/ideas/[ideaId]/vote — toggles the current user's vote (vote/unvote), enforcing one vote per member per idea
- Standard club-ownership checks throughout, same pattern as everywhere since 06

### Scope Limits

- don't add comments/discussion threads on ideas — text + votes only
- don't add re-ranking/reordering beyond sort-by-votes — no manual reordering of the ranked list
- don't remove the underlying canvas note automatically unless you've decided that's the cleaner behavior (see Data section) — be deliberate, not accidental

### Check When Done

- promoting a note creates a real BrainstormIdea and it appears in the ranked list, correctly sorted
- a member can vote once per idea, and clicking again removes their vote rather than adding a second one
- the ranked list correctly reflects real vote counts after reload
- cross-club isolation holds (a different club's brainstorm ideas never leak in)
- npm run build passes

Report back on both parts separately — don't let the bug fix's summary get lost inside the feature summary.