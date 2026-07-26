Build the calendar view of Events — the same underlying event data from `14-events-board.md`'s board, shown as a month calendar instead of columns, switchable via a tab. Per `project-overview.md`: "board view + calendar view of the same event data."

## Route & Tab Structure

Still `/events` — add a shadcn `Tabs` at the top: "Board" (default, what `14` built) and "Calendar" (new). Don't duplicate data-fetching logic between the two tabs; both read from the same Prisma query, just render it differently.

## Calendar UI

A standard month-grid view — per `ui-context.md`'s general layout conventions (dark surfaces, `rounded-2xl` container, `accent-primary` for the current day marker). Each day cell shows up to a few event titles (truncate/show a "+N more" if a day has many events); clicking a day (or an event within it) opens the same read-only detail view from `14`'s board — reuse that component, don't build a second one.

Month navigation: previous/next month arrows, a "Today" button to jump back to the current month.

## Handling Events Without a Date

Per `05-prisma.md`, `Event.date` is nullable — a card can exist on the board (`IDEA`/`PLANNING`) before anyone's picked a date. These can't be placed on a calendar grid. Show them in a small "Unscheduled" list alongside the calendar (not inside the grid) rather than silently hiding them — a club shouldn't lose visibility into an idea just because it lacks a date yet.

## Data

No new API route needed — reuse the same Prisma query pattern already established for fetching a club's events (from `14`). This is a read view; don't add real-time sync here (no Liveblocks room needed for the calendar itself) — if an event's date changes elsewhere, a normal page load/refresh is sufficient, this isn't a collaborative-editing surface the way the board's column ordering is.

## Scope Limits

- don't add drag-to-reschedule on the calendar (dragging an event to a different date) — that's a reasonable future addition, flag it in `progress-tracker.md` as an open idea, don't build it now
- don't add week/day view toggles — month view only for this spec
- don't duplicate the event detail component — reuse `14`'s

## Check When Done

- switching between Board and Calendar tabs shows the same underlying events, correctly
- events with a date appear on the correct day
- events without a date appear in the Unscheduled list, not silently missing
- month navigation works correctly (including across year boundaries — December → January)
- clicking an event opens the same detail view as the board
- `npm run build` passes