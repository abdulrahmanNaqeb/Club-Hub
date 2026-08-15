**Retroactive spec.** This feature was built and shipped without going through the normal spec-first process (see the "Connected Idea → Plan → Event Workflow — 2026-07-28" entry in `progress-tracker.md`). The product owner confirmed it stays. This document describes what actually exists in the codebase today so it's reviewable and so future work has a real reference instead of a tracker entry. Nothing here is a proposal — every statement below is a description of shipped behavior.

It sits between `19-brainstorm-promote-to-list.md` (which it supersedes in practice) and `20-presence-avatars-cursors.md`, hence the `20b` number.

## Goal

Close the gap between the freeform Brainstorm canvas and the Events board. Before this, promoting a canvas note produced a text-and-votes row that dead-ended: nothing connected a winning idea to the `Event` it eventually became, and there was no single place to see whether an event was actually ready to run.

The workflow is now one line with one source of truth at each stage:

freeform notes (Liveblocks) → structured item (`BrainstormIdea`, typed Event or Issue) → linked plan (`Event` for event ideas, an action checklist for issues) → month/year Plan preview.

Two rules define the whole design:

1. **Exactly one canonical record per stage.** Once an event idea starts planning, its linked `Event` row is the only source for title, brief, status, schedule, location, estimated cost, equipment, promotion, and checklist. Brainstorm, Board, Calendar, and the Plan preview all serialize *that row*. No surface keeps a copied event field.
2. **Not every idea is an event.** An idea explicitly classified as an `ISSUE` never becomes an `Event`, never reaches the calendar, and gets its own action checklist instead.

## Data Model

Defined in `prisma/models/brainstorm.prisma` and `prisma/models/event.prisma`, added by migration `20260728233000_connect_brainstorm_event_plans` (additive; existing ideas defaulted to `EVENT`/`OPEN`, existing events kept their data with the new planning fields nullable).

### `BrainstormIdea` — the structured item

| Field | Purpose |
| --- | --- |
| `text` | Short title. The working title until an `Event` exists. |
| `details` | Optional starting brief, carried into `Event.description` on start. |
| `kind` | `BrainstormItemKind` — `EVENT` or `ISSUE`. Defaults to `EVENT`. |
| `status` | `BrainstormItemStatus` — `OPEN` → `SHORTLISTED` → `IN_PROGRESS` → `COMPLETED` → `ARCHIVED`. Defaults to `OPEN`. |
| `sourceNoteIds` | Provenance: the Liveblocks note IDs this item was promoted from. Deduplicated on write. |
| `voteCount` / `voterIds` | From `19`. `voteCount` is always derived from `voterIds.length`, never incremented independently. |
| `linkedEvent` | The back-relation of `Event.sourceIdeaId`. Nullable and at most one. |
| `tasks` | `BrainstormIdeaTask[]` — issue action items only. |

Indexed on `clubId` and `(clubId, status)`.

### `BrainstormIdeaTask` — issue action items

`title`, `done`, optional `assignee` (Clerk user ID), cascade-deleted with its idea. Deliberately separate from `EventTask`: an issue has no event to hang a checklist on.

### `Event` — the canonical plan

Existing model, extended with three planning fields plus the link:

- `estimatedCost` — `Decimal(12,2)`, matching every other money column in the app.
- `equipmentNotes` / `promotionNotes` — free text for equipment/logistics and poster/promotion decisions.
- `sourceIdeaId` — nullable FK to `BrainstormIdea`, **`@unique`**, `onDelete: SetNull`.

The unique constraint is what makes "start planning" idempotent — it is the enforcement mechanism, not a hint. Directly-created board events keep `sourceIdeaId = null`.

### Planning readiness

`lib/event-plan.ts` defines readiness once, as seven requirements: `brief`, `schedule`, `location`, `estimatedCost`, `equipment`, `promotion`, `checklist`. `getEventPlanReadiness()` returns `{ completed, total, isReady, missing }`. This is computed server-side in `lib/event-serialize.ts` and recomputed client-side by the detail dialog after an edit, so cards, dialogs, and the Plan preview can never disagree about what "ready" means.

## UI

### Brainstorm canvas (`components/brainstorm/`)

- Promote/delete controls live in a dedicated note header with content padded below it, so they cannot overlap note text.
- Selection: click to select, shift-click to add, click empty canvas to clear, "Select all". Selection is personal and transient — it lives in local React state, not in Liveblocks. Note positions and text remain Liveblocks-authoritative and collaborative.
- Dragging any selected note moves the whole selection. The offsets are computed by `calculateBrainstormGroupMove()` in `lib/brainstorm-selection.ts`, which clamps every moved note to the canvas bounds independently.
- Selected notes can be deleted together, or promoted together into **one** item via `PromoteNotesDialog` — which asks for type (Event idea / Issue to solve), title, and starting brief, pre-filling the title from the first non-empty note and the brief as a bulleted merge of all of them.
- **Ordering matters:** the Postgres row is created first; the Liveblocks notes are deleted only after that request succeeds. A failed promotion leaves the notes on the canvas and says so.

### Idea Pipeline (`ranked-ideas-list.tsx`, the `/brainstorm` "Ranked List" tab)

Each row shows kind, decision stage, votes, and the vote toggle from `19`, plus a progress line — readiness for linked events, completed/total actions for issues. The action button reads "Develop", "Continue planning", or "Open event plan" depending on state. Once an item is linked, the row displays the *event's* title and description, not the idea's stale copy.

Vote results are applied straight from the vote response into a local override map keyed by idea ID and merged during render; newly promoted items arrive through `router.refresh()`. There is no effect syncing state to props.

### Planning dialogs

- `BrainstormPlanningDialog` — for items with no linked event. Edits title, brief, type, and decision stage; shows the action checklist for in-progress issues; and has the "Start event plan" / "Start issue plan" action. Starting first PATCHes the working fields so the created `Event` is built from exactly what the user is looking at. The type selector is disabled once an event is linked.
- `EventDetailDialog` — the existing shared event editor from `16`, extended rather than replaced. Estimated cost, equipment/logistics, and poster/promotion sections were added alongside brief, date/time, location, status, and the task checklist, plus a "Planning readiness" section listing the seven requirements and which are outstanding. This same dialog opens from the Board, the Calendar, the Plan tab, and the Idea Pipeline.

### Events workspace (`events-workspace.tsx`)

Event state is lifted above the tabs into `EventsWorkspace`, so an edit made in any tab is immediately visible in all three.

- **Board** / **Calendar** as before.
- **Plan** (`events-plan-preview.tsx`) — year/month toggle with year navigation. Groups `CONFIRMED`/`DONE` dated events by month, each card showing final brief, date, location, estimated cost, and an `n/7 ready` badge. Above that, a "Needs attention before finalizing" panel lists `PLANNING`/`CONFIRMED` events that are not ready or have no date. Every card opens the shared detail dialog.
- Board cards show date/location/task/readiness summaries instead of title only.
- Because status can now change from Calendar or Plan while the Board tab is already mounted, `syncCanonicalStatuses` reconciles Liveblocks column ordering to the canonical Prisma status and drops stale or duplicated IDs from the lists.

## API

All routes resolve the club from the active Clerk org via `getActiveClub()` (which also enforces `approvalStatus === APPROVED`) and then re-check the ownership chain of every record named in the path. No route trusts a client-supplied `clubId`, `ideaId`, or `eventId` on its own.

| Route | Behavior |
| --- | --- |
| `POST /api/brainstorm/ideas` | Creates one item from one or more notes. Body: `text`, `details`, `kind`, `sourceNoteIds`. Bounded by `MAX_BRAINSTORM_TEXT_LENGTH`, `MAX_LONG_TEXT_LENGTH`, `MAX_BRAINSTORM_NOTES`. |
| `PATCH /api/brainstorm/ideas/[ideaId]` | Updates `text`, `details`, `kind`, `status`. Returns **409** when changing a linked item away from `EVENT`. |
| `POST /api/brainstorm/ideas/[ideaId]/start` | Issues: just moves to `IN_PROGRESS`. Events: creates the `Event` and sets `IN_PROGRESS` in one transaction. Already linked → returns the existing item. A `P2002` from the unique `sourceIdeaId` is swallowed and the winner's item is returned. |
| `POST /api/brainstorm/ideas/[ideaId]/vote` | Toggles the caller's vote under **Serializable** isolation with up to 3 retries on `P2034`, so simultaneous voters cannot erase each other's writes. `voteCount` is set from the resulting array length. |
| `POST/PATCH/DELETE .../tasks[/taskId]` | Issue action items. POST 404s unless the idea's `kind` is `ISSUE`. |
| `PATCH /api/events/[eventId]` | Extended with `estimatedCost`, `equipmentNotes`, `promotionNotes`, parsed by `parseEventPatchBody()` in `lib/event-plan-input.ts` — cents-only money through `parseMoneyAmount`, timezone-qualified RFC 3339 datetimes through `parseBusinessDateTime`, and length caps on all text. |

Every `BrainstormIdea` crosses the boundary through `serializeIdea()` (`lib/brainstorm-serialize.ts`), which emits `hasVoted` and deliberately **never** emits `voterIds` — who else voted isn't the requester's business.

## Scope Boundaries

Things this feature deliberately does **not** do, so a future session doesn't "restore" them by mistake:

- **No new real-time surface.** Liveblocks stays limited to the Events board and the Brainstorm canvas. Structured items, issues, event planning, calendar, and the Plan preview are all plain Postgres-backed views — `architecture-context.md` invariant 8 still holds.
- **No asset uploads.** Poster/promotion and equipment work are structured notes and checklist items. A general-purpose asset-upload system was excluded pending storage/retention requirements.
- **No shared selection.** Canvas multi-select is intentionally personal and transient; it is not synced to other members.
- **Issues never reach the calendar** and never get an `Event`.
- **No union-facing changes.** This is entirely club-side; the event approval queue (`10`) is untouched.
- **Readiness is advisory.** Nothing blocks confirming an event whose readiness is incomplete — the Plan tab surfaces it, it does not gate it.

## Check When Done

Descriptive — this is the state the shipped code is already in.

- Promoting several selected notes creates exactly one `BrainstormIdea` with all their IDs in `sourceNoteIds`, and the notes leave the canvas only after that succeeds.
- An item can be classified Event or Issue, and an issue never gains a linked `Event` or appears on the calendar.
- Starting an event plan creates at most one `Event` — concurrent or repeated clicks converge on the same row rather than duplicating. Covered by `tests/security-regressions.test.ts` ("brainstorm event promotion is tenant-scoped and duplicate-safe") and by the 12-caller database run recorded in the tracker.
- Editing an event from the Board, Calendar, Plan tab, or Idea Pipeline shows the change in all of them without a reload, and the Board card does not stay in a stale column.
- Readiness is one seven-part definition shared by cards, dialogs, and the Plan preview ("event planning readiness uses one shared seven-part definition").
- Planning inputs reject malformed money, malformed dates, and oversized logistics text server-side ("event plan fields reject malformed money, dates, and oversized logistics").
- Group movement clamps to canvas bounds ("multi-selected brainstorm notes move atomically with boundary clamping").
- Cross-club isolation holds on every idea/task/start/vote route.
- `npm test`, `npm run lint`, and `npm run build` pass.
