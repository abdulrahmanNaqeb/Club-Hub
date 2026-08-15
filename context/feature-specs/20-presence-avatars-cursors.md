Two things this session, in order.

## Part 1: Bug fix — receipt download route rejects the legitimate club member

Clicking a "Receipt X" link on the Budget page (which opens the download route, something like /api/budget/entries/[entryId]/receipts/[filename]) returns {"error": "Not authorized for this club."} even when the user is a genuine, currently-active member of the club that owns that entry.

Investigate the actual cause — likely candidates:
- Is the route correctly resolving the active club from the request (e.g. via getActiveClub() or equivalent), the same way every other budget route does? Compare this route's auth/ownership logic directly against the working POST/PATCH/DELETE entry routes from 17-budget-categories-entries.md — if those work and this doesn't, find the actual difference in how each resolves the active club.
- Is there anything different about how this route is invoked (a direct link navigation/new tab vs. a fetch() call from the same page) that could cause session/org context to be missing or resolved differently?
- Reproduce it yourself against the real dev environment if possible — click through as a real club member and confirm you can reproduce the same "not authorized" error before attempting a fix.

Fix the actual root cause, then verify by clicking a real receipt link as a legitimate club member and confirming the file actually loads/downloads instead of erroring.

## Part 2: 20-presence-avatars-cursors.md

Show active room participants inside the editor canvas view, without changing the editor home navbar.

### Implementation

1. Keep the existing navbar behavior as-is.
   - do not change the app's main navbar
   - do not move or redesign the shared navbar component globally
   - this presence UI only appears in the Events board and Brainstorm canvas rooms, nowhere else

2. Add the participant avatar group inside the Events board and Brainstorm canvas views (both — this is the payoff for both rooms set up back in 13-liveblocks-setup.md).
   - position it in the top-right corner of the canvas/board area
   - keep it visually separate from the main navbar actions
   - get the current user's ID from the active Clerk session
   - filter the Liveblocks presence list to exclude any entry whose user ID matches the current Clerk user ID
   - render the filtered list as collaborator avatars only
   - render the current user separately using the existing Clerk UserButton (from the sidebar) — do not render a second avatar for them from the Liveblocks presence list
   - collaborator avatars and the Clerk UserButton should read as visually consistent (similar size)
   - collaborator avatars are display-only, not interactive
   - if no collaborators are present, just show the existing "N people viewing" count from 14/18 — don't add a redundant empty avatar row

3. Render collaborator avatars.
   - use profile photos when available (from Liveblocks UserMeta, set up in 13)
   - fall back to initials when there is no image
   - show up to five collaborator avatars in an overlapping stack
   - show a +N overflow chip when there are more than five
   - add a subtle ring so avatars stay readable on the dark canvas

4. Add live cursors to both the Events board and the Brainstorm canvas.
   - render cursors for other participants only, never the current user
   - use the existing Liveblocks presence state (cursor field, already defined in liveblocks.config.ts since 13) to broadcast cursor position
   - update cursor position on mouse move within the board/canvas area
   - clear cursor to null on mouse leave
   - show a small colored pointer with a name badge attached
   - match the pointer and badge color to the participant's cursorColor from lib/cursor-color.ts (already built in 13)

### Scope Limits

- don't add participant avatars to the shared navbar globally
- don't remove any existing navbar actions
- don't replace Clerk user/profile/logout behavior
- don't make collaborator avatars interactive
- don't change canvas node or Events board drag/drop behavior — this is purely an additive presence layer

### Check When Done

- presence avatars and cursors only appear in the Events board and Brainstorm canvas, nowhere else
- current user is resolved from the active Clerk session and excluded from the collaborator avatar list
- cursors render for other participants only, colored consistently with lib/cursor-color.ts
- two real browser sessions on the same club's board (or canvas) show each other's avatars and live cursor movement
- npm run build passes

Report back on both parts separately.