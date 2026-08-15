Set up Liveblocks — the real-time collaboration infrastructure for the two surfaces that need it (Events board, Brainstorm canvas), per `architecture-context.md`. This is foundation only — no visible canvas or board yet, that's `14-events-board.md` onward.

## Before Starting

Check if `liveblocks.config.ts` or a Liveblocks client already exists from earlier scaffolding — this project's `create-next-app` history has had stray leftover files before. If something's already there and correct, don't recreate it; if it's incomplete or wrong, fix it in place rather than duplicating.

## Configuration

Create `liveblocks.config.ts` at the project root.

Define **Presence** (per-user, ephemeral, not persisted):
- `cursor`: `{ x: number; y: number } | null`
- `isTyping`: boolean (useful later for brainstorm note editing indicators)

Define **UserMeta**:
- `id`: Clerk user ID
- `name`: display name
- `avatarUrl`: string
- `cursorColor`: a hex color, deterministically assigned per user (see helper below)

There are two distinct room *types* this app will use — Events board rooms and Brainstorm canvas rooms — but they share the same Presence/UserMeta shape. Don't build separate config types for each; room ID naming (below) is what distinguishes them.

## Liveblocks Client

Create `lib/liveblocks.ts`: a cached Liveblocks Node client (server-side, for the auth route below), following the same caching pattern as `lib/prisma.ts` from `05-prisma.md`.

Add `lib/cursor-color.ts`: a helper that deterministically maps a Clerk user ID to a consistent color from a small fixed palette (6-8 colors is plenty) — same user should always get the same cursor color across sessions, different users should look visually distinct. A simple hash-of-user-id-mod-palette-length approach is sufficient.

## Room Naming Convention

Room IDs are derived from the club and the surface, not arbitrary: `events-board:{clubId}` and `brainstorm-canvas:{clubId}`. Document this convention as a comment in `liveblocks.config.ts` so future specs building the actual board/canvas don't invent a different scheme.

## Auth Route

Create `POST /api/liveblocks-auth`.

This route must:
1. Require Clerk authentication.
2. Parse the requested room ID from the request body and verify it matches the `events-board:{clubId}` or `brainstorm-canvas:{clubId}` pattern — reject anything else with 400.
3. Extract the `clubId` from the room ID and verify the requesting user is a member of that club's Clerk org via `lib/org-scope.ts` — the same access check already used everywhere else in the club workspace. Return 403 for a mismatch.
4. Return a Liveblocks session token with the user's name, avatar, and their deterministic cursor color from `lib/cursor-color.ts` attached.

Do not create the Liveblocks room here — rooms are created implicitly on first connection, no explicit creation step needed for this setup.

## Dependencies

Install `@liveblocks/client`, `@liveblocks/react`, `@liveblocks/node` if not already present (check `package.json` first, per the "don't redo existing work" note above).

## Scope Limits

- don't build any visible canvas, board, or presence UI yet — purely the auth/config/client foundation
- don't add Liveblocks Storage schema yet (that's part of `14-events-board.md`, where there's actual board state to define)
- don't touch the Brainstorm canvas — later, separate spec

## Check When Done

- `liveblocks.config.ts` defines Presence and UserMeta correctly
- the Liveblocks Node client is cached, matching the `lib/prisma.ts` pattern
- `/api/liveblocks-auth` rejects unauthenticated requests, rejects malformed room IDs, and rejects users who aren't members of the club in the room ID
- a real authenticated request for a room ID matching a club the user belongs to returns a valid session token (test this by manually POSTing to the route, since there's no UI yet to trigger it through)
- `npm run build` passes