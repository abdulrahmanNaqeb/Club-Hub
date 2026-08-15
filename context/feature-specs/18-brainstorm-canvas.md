Build the Brainstorm canvas — a freeform, real-time multiplayer sticky-note surface where club members drop and arrange notes together live. Per `ui-context.md`'s "Brainstorm Canvas" section and `architecture-context.md`'s storage model.

## Route

`/brainstorm` (flat, session-based). Protected by `lib/org-scope.ts`.

## Room & Persistence Model — read carefully, this differs from the Events board

Per `architecture-context.md`, the Events board (`14`) stores ordering in Liveblocks Storage directly and treats that as durable. The Brainstorm canvas uses a **different** pattern: per `architecture-context.md`'s Storage Model, the canvas's live state is periodically snapshotted to **Vercel Blob** at `brainstorm/{clubId}.json`, referenced by `Club.brainstormCanvasJsonPath` — not read live from Liveblocks Storage on every load the way the board is.

Concretely:
- While the room is live, notes live in Liveblocks Storage (a `LiveMap` of note ID → note data: text, position `{x, y}`, color index, creation order) — this is the real-time collaborative surface.
- On a meaningful interval or event (e.g. debounced on changes, or on room disconnect — pick whichever is simpler to implement correctly), snapshot the current Storage state to Blob and update `Club.brainstormCanvasJsonPath`.
- On room load: if Liveblocks Storage is already populated (room has been used before, still warm), use that directly. If Storage is empty but a Blob snapshot exists, hydrate Storage from the Blob snapshot before rendering. If neither exists, start with an empty canvas.

Use the `brainstorm-canvas:{clubId}` room naming convention from `13-liveblocks-setup.md`.

## Canvas UI

Per `ui-context.md`: freeform surface, no React Flow, no connection handles or edges — this is sticky notes, not a diagram. New notes default to a color from the 8-pair palette, assigned round-robin by creation order (deterministic, not user-picked, per `ui-context.md`'s explicit instruction to keep note creation fast).

- click-and-drag empty canvas space to create a note at that position (or an explicit "add note" button placed at the click point — your call on which feels more natural, but creation should be fast, one action)
- drag existing notes to reposition (updates Storage live)
- double-click (or click) a note to edit its text inline
- delete a note (small delete affordance on hover/select, matching the low-stakes-delete pattern from board cards, not the confirm-dialog pattern from budget/financial records)
- basic pan/zoom is reasonable for a freeform canvas at scale, but keep it simple — a fixed-size scrollable canvas is an acceptable simpler alternative if pan/zoom adds real complexity; flag which you chose in the tracker

## Presence

Show a basic "N people viewing" count, same minimal treatment as `14`'s board — full cursor rendering is still reserved for `20-presence-avatars-cursors.md`, don't build it here.

## API

A single endpoint to trigger/handle the Blob snapshot: `POST /api/brainstorm/[clubId]/snapshot` (or a server action, your call), verifying club ownership before writing. This can be called from the client on a debounce, or you can explore Liveblocks' own storage-persistence/webhook patterns if simpler — check current Liveblocks docs rather than assuming a specific API shape from training data, since this is exactly the kind of thing that changes between versions.

## Scope Limits

- don't build "promote to ranked list" — that's `19-brainstorm-promote-to-list.md`, the very next spec
- don't build cursor rendering — `20`
- don't over-build pan/zoom if it adds real complexity — a simpler fixed canvas is fine, per above
- don't add note resizing, rich text, or attachments — plain text notes only

## Check When Done

- two real browser sessions on the same club's `/brainstorm` see each other's note creation/movement/edits live
- reloading the page after activity shows the notes still there, correctly positioned (proves the Blob snapshot + hydration round-trip actually works, not just live Storage)
- notes get colors assigned deterministically, not randomly
- deleting a note works without a confirmation dialog (matching the low-stakes pattern)
- `npm run build` passes