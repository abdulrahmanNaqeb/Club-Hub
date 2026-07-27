Replace the read-only event detail dialog from `14-events-board.md` with the real, editable event detail panel: editable core fields, and a checklist of tasks with per-item assignees. This is plain request/response — per `architecture-context.md`'s invariant, Liveblocks stays scoped to the board's drag/reorder and the Brainstorm canvas only; the checklist does not need real-time sync, a normal mutation + refetch is correct here.

## Scope Note

Per `project-overview.md`, the full detail panel eventually includes a "linked budget" section — that depends on `BudgetCategory`/`BudgetEntry`, which don't exist until `17-budget-categories-entries.md`. Don't build that section yet; leave a clear placeholder or simply omit it for now rather than stubbing something that'll need rework next spec.

## Editable Core Fields

Extend the existing dialog (don't build a second one) so title, description, location, and date/time become editable in place — not a separate "edit mode" toggle, just editable fields that save on blur or via an explicit "Save" action, your call on which feels right given the existing dialog pattern.

Extend the existing `PATCH /api/events/[eventId]` route (from `14`, currently only handles `status`) to also accept `title`, `description`, `location`, `dateTime`. Verify club ownership the same way that route already does — don't duplicate the check.

## Checklist

Below the core fields, a task list:

- each `EventTask` row: a checkbox (toggles `done`), the task title, an assignee picker
- "Add task" input/button at the bottom of the list
- click a task's title to rename it inline
- a delete action per task (simple, no confirmation dialog needed for something this low-stakes — unlike deleting a club application)

**Assignee picker**: a dropdown of the current club's real members, resolved via Clerk's org membership list — reuse the same Clerk Backend API pattern already established in `04-team-view.md`, don't re-fetch or re-derive member data a third way. Selecting "Unassigned" should be a valid option (matches `EventTask.assignee` being nullable per `05-prisma.md`).

## API

- `POST /api/events/[eventId]/tasks` — body: `{ title }`, assignee starts null
- `PATCH /api/events/[eventId]/tasks/[taskId]` — body: any of `{ title, done, assignee }` — when `assignee` is non-null, the route must validate that the provided user id is a current member of the active club's Clerk organization and reject invalid or out-of-club ids.
- `DELETE /api/events/[eventId]/tasks/[taskId]`

All three verify the task's event belongs to the requester's active club, same ownership pattern as everywhere else.

## Optional, Only If Cheap: Revisit the Deferred Assignee Stripe

`14-events-board.md` deferred the `accent-primary` left-edge stripe on cards (originally meant to indicate "assigned to you," but there was no real assignee data yet). Now there is — a card could show the stripe if the current user has any `EventTask` assigned to them on that event. Do this only if it's a small addition on top of what you're already touching; if it adds real complexity, leave it deferred and note that explicitly instead of half-building it.

## Scope Limits

- no linked-budget section yet — see Scope Note above
- no Liveblocks/real-time sync on the checklist — plain mutation + refetch
- no due dates or task ordering/reordering for this unit — flat list, in creation order, is enough for now
- don't touch the board's drag/drop or column logic — this spec only extends the detail dialog

## Check When Done

- opening an event from the board (or calendar) shows the real editable detail panel, not the old read-only summary
- editing title/description/location/date persists correctly (verify via reload, not just optimistic UI)
- adding, renaming, completing, reassigning, and deleting tasks all work and persist
- the assignee picker shows real club members, not placeholder data
- a second browser session viewing the same event does NOT need to be real-time-synced for this spec to pass (that's explicitly out of scope here) — but reloading should show the other session's changes
- `npm run build` passes
