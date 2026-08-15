# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries defined in `architecture-context.md`.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any`; use explicit interfaces or narrowly scoped types.
- Validate unknown external input at system boundaries before trusting it.
- Use `interface` for object contracts.

## Next.js

- Default to React Server Components.
- Add `"use client"` only when the component needs browser interactivity, hooks, or real-time state.
- Keep route handlers focused on a single responsibility.
- Long-running work belongs in background tasks, not in request handlers.

## Styling

- Use CSS custom property tokens defined in `globals.css` — no raw Tailwind color classes like `zinc-*` or hardcoded hex values.
- Reference tokens through their Tailwind utility names: `bg-page`, `text-copy-primary`, `border-surface-border`, `text-brand`, etc.
- Maintain the border radius scale: `rounded-xl` for small elements, `rounded-2xl` for cards, `rounded-3xl` for modals.

## API Routes

- Validate and parse request input before any logic runs.
- Enforce auth and **organization ownership** checks before any mutation — every request must resolve the active Clerk organization and every query must be scoped to it.
- Return consistent, predictable response shapes.
- Keep route handlers thin — push complexity into shared modules or background tasks.

## Data and Storage

- Club, membership, event, task, and budget data belong in PostgreSQL via Prisma.
- Brainstorm canvas snapshots belong in Vercel Blob; Prisma stores only the blob URL reference.
- Do not store large generated content directly in the database.
- Task run / background job records are first-class relational data — treat organization ownership as verified before any Liveblocks token issuance or job trigger.

## File Organization

- `lib/` — shared infrastructure: Prisma client, auth helpers, org-scoping utilities.
- `trigger/` — all durable background tasks (reminders, digest emails).
- `components/` — UI composition only; no business logic.
- `app/api/` — route handlers for auth, triggering, and persistence.
- Name files after the responsibility they contain, not the technology.
