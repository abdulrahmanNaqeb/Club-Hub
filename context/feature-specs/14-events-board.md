Build the real Events board — a live, multi-user kanban board where clubs manage events across status columns, backed by Liveblocks for real-time sync and Prisma for durable storage. This replaces the standalone `/events/request-approval` placeholder flow's board-view gap — approved events now show up somewhere real.

## Route

`/events` (flat, session-based per the active club — see `architecture-context.md`'s corrected routing note). Protected by `lib/org-scope.ts`, same as every other club route.

## The Sync Model — read this carefully before implementing

Prisma remains the source of truth for event *existence and details* (title, description, status, date, location) — nothing about that changes. What Liveblocks adds is: (1) live presence while viewing the board, and (2) instant multi-user sync of drag-and-drop reordering and column moves, without requiring a page refresh or poll.

Specifically:
- **Column membership** (which status an event is in) is a real Prisma field (`Event.status`) — moving a card to a new column must update Prisma, not just Liveblocks state, or the change won't survive a reload.
- **Order within a column** is not currently a Prisma field. Store it in Liveblocks **Storage** instead: one `LiveList<string>` (event IDs) per status column, inside a `LiveObject` keyed by status. This is genuinely durable (Liveblocks Storage persists server-side, it isn't ephemeral like Presence), so this is a reasonable, deliberate choice — not a shortcut.
- **Reconciliation on room load**: when the board first connects, compare Prisma's events (grouped by status) against what's already in Liveblocks Storage's lists. Any event that exists in Prisma but isn't yet in any list (e.g. a brand-new event just approved via `10-event-approval-queue.md`) gets appended to its status column's list. Do this once, on room initialization — don't re-run it on every render.

## Room Setup

Use the `events-board:{clubId}` room naming convention from `13-liveblocks-setup.md`. Build the client-side room wrapper (`LiveblocksProvider` using `/api/liveblocks-auth`, `RoomProvider`, `ClientSideSuspense` with a loading state, error fallback for connection issues) — same shape the spec described for the auth route to plug into.

## Board UI

Per `ui-context.md`'s "Events Board" section: columns (`IDEA` → `PLANNING` → `CONFIRMED` → `DONE`) on `bg-surface`/`border-default`/`rounded-2xl`; event cards one layer up on `bg-elevated`/`rounded-xl`, with the `accent-primary` left-edge stripe for cards assigned to the current user (assignee comes later with checklists in `16` — for now, base this on whether the current user created the event, if that's tracked, otherwise skip the stripe logic for this spec and note it as deferred).

Use `dnd-kit` for drag-and-drop, not React Flow (there's no node/edge graph here, just column-based dragging).

Each card shows: title, status-appropriate secondary info (date if set), and is clickable (full detail panel with checklist is `16-event-detail-checklist.md` — for now, clicking can just show a bare read-only summary, or be a no-op with a "coming soon" state, your call, but don't build the full checklist UI here).

## Drag & Drop Behavior

- Reordering within a column: update the relevant Liveblocks `LiveList` only — no Prisma call needed, this is pure ordering.
- Moving to a different column: update both — remove from the old column's `LiveList`, add to the new column's `LiveList`, AND call `PATCH /api/events/[eventId]` to update `Event.status` in Prisma. Do the Liveblocks Storage update optimistically (instant UI feedback), and if the Prisma call fails, revert the Storage change and show an error — don't leave the UI showing a state the database doesn't actually have.

## API

`PATCH /api/events/[eventId]` — body: `{ status }`. Verify the event's club matches the requester's active club org via `lib/org-scope.ts` before updating.

## Scope Limits

- don't build the calendar view — `15-calendar-view.md`
- don't build the full event detail/checklist panel — `16-event-detail-checklist.md`
- don't build presence avatars/live cursors yet — `20-presence-avatars-cursors.md` builds the visual layer on top of the room connection this spec establishes; a basic "N people viewing" count is fine if trivial, but don't build cursor rendering here
- don't add creating new events directly from the board — for now, events only enter the board via the approval flow (`10`); a "create idea" button that doesn't need union approval is a reasonable future addition, but flag it as an open question in `progress-tracker.md` rather than building it now

## Check When Done

- the board loads real events from Prisma, grouped into the correct columns
- two browser windows (or two real users) viewing the same club's board see each other's drag/reorder actions live, without refreshing
- moving a card to a new column persists after a full page reload (proves the Prisma write actually happened, not just the optimistic UI)
- reordering within a column persists after reload (proves Liveblocks Storage actually persisted, not just Presence)
- a newly-approved event (via `10`'s flow) appears on the board on next load without manual intervention
- `npm run build` passes