# UI Context

## Theme

Dark only. No light mode. The visual language is a dark technical workspace — near-black backgrounds, layered surfaces, and vivid accent colors for interactive elements.

All colors are defined as CSS custom properties in `globals.css` and mapped to Tailwind tokens via `@theme inline`. Components must use these tokens — no hardcoded hex values or raw Tailwind color classes like `zinc-*`.

| Role             | CSS Variable            | Hex / Value                |
| ---------------- | ------------------------ | --------------------------- |
| Page background  | `--bg-base` (Tailwind: `bg-page`) | `#080809`           |
| Surface          | `--bg-surface`           | `#111114`                   |
| Elevated surface | `--bg-elevated`          | `#18181c`                   |
| Subtle surface   | `--bg-subtle`            | `#1e1e23`                   |
| Default border   | `--border-default`       | `#2a2a30`                   |
| Subtle border    | `--border-subtle`        | `#3a3a42`                   |
| Primary text     | `--text-primary`         | `#f0f0f4`                   |
| Secondary text   | `--text-secondary`       | `#c0c0cc`                   |
| Muted text       | `--text-muted`           | `#808090`                   |
| Faint text       | `--text-faint`           | `#505060`                   |
| Brand accent     | `--accent-primary`       | `#ff8a00` (orange)          |
| Brand dim        | `--accent-primary-dim`   | `rgba(255, 138, 0, 0.12)`   |
| Secondary accent | `--accent-secondary`     | `#6457f9` (indigo-purple)   |
| Secondary text   | `--accent-secondary-text`| `#8b82ff`                   |
| Error            | `--state-error`          | `#ff4d4f`                   |
| Success          | `--state-success`        | `#34d399`                   |
| Warning          | `--state-warning`        | `#fbbf24`                   |

Tailwind utility names map to these variables. Use `bg-page`, `bg-surface`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.

Note: the page-background token is exposed as Tailwind utility `bg-page`, not `bg-base` — `base` collides with Tailwind's built-in `text-base` font-size utility (shadcn/ui components rely on `text-base` for font sizing; naming our color token `--color-base` silently overrode it to set text color instead of font size).

`accent-primary` (orange) is the default interactive color across the app — primary buttons, active nav items, links. `accent-secondary` (indigo-purple) is reserved for the Brainstorm feature specifically (creation actions, promote-to-list, new-idea affordances) so it reads as a distinct "creative" mode rather than being used generically.

## Typography

| Role      | Font       | CSS Variable        |
| --------- | ---------- | -------------------- |
| UI text   | Geist Sans | `--font-geist-sans`  |
| Code/mono | Geist Mono | `--font-geist-mono`  |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Geist Sans with `antialiased`. Geist Mono is reserved for numbers/stats/timestamps — budget figures, dates, task counts — reinforcing the "tool" feel.

## Border Radius

Radius increases with surface depth — smaller for inner elements, larger for outer containers.

| Context           | Class          |
| ------------------ | -------------- |
| Inline / small UI  | `rounded-xl`   |
| Cards / panels     | `rounded-2xl`  |
| Modal / overlay    | `rounded-3xl`  |

## Events Board

The Events board is a Kanban-style surface (status columns, draggable event cards) — not a node/edge diagram, so it does not use React Flow or connection handles. Built with a drag-and-drop library (e.g. `dnd-kit`) over Liveblocks-backed shared state.

- Columns sit on `bg-surface` with `border-default`, `rounded-2xl`.
- Event cards sit one layer up on `bg-elevated`, `rounded-xl`, with a thin left-edge accent stripe in `accent-primary` for cards assigned to the current user.
- Live presence (other members' cursors/avatars while viewing the board) uses small avatar stacks + colored cursor labels — subtle, not intrusive.
- Drag state: lifted card gets a subtle shadow and `border-subtle` outline; drop targets highlight with `accent-primary-dim` background.

## Brainstorm Canvas

Freeform sticky-note surface, real-time via Liveblocks. Notes reuse a fixed color palette so multiple ideas stay visually distinct without users hand-picking colors:

| Note fill | Text color | 
| --------- | ---------- |
| `#1F1F1F` | `#EDEDED`  |
| `#10233D` | `#52A8FF`  |
| `#2E1938` | `#BF7AF0`  |
| `#331B00` | `#FF990A`  |
| `#3C1618` | `#FF6166`  |
| `#3A1726` | `#F75F8F`  |
| `#0F2E18` | `#62C073`  |
| `#062822` | `#0AC7B4`  |

Default note color: `#1F1F1F` with `#EDEDED` text — the color assigned to a new note is deterministic (e.g. round-robin by creation order), not user-chosen, to keep the flow fast. Notes are simple rounded rectangles (`rounded-xl`) with a slight rotation/shadow for a physical "sticky note" feel — no diagram shapes, no connecting edges.

Promoting a note to the ranked list moves it out of canvas space into a plain vertically-sorted list UI (standard `Card` components, not canvas elements).

## Component Library

shadcn/ui on top of Tailwind. No custom design system. Components live in `components/ui/`. Use the `shadcn` CLI to add new components rather than writing them from scratch.

## Layout Patterns

- Persistent left sidebar: club/org switcher (top), main nav (Team / Events / More), user menu (bottom). Sits on `bg-surface` with a `border-default` right edge.
- Events board and Brainstorm canvas are full-bleed surfaces within the main content area — everything else (Team, Budget, Calendar) is a standard scrollable dashboard layout.
- Modals and dialogs: centered overlay, `rounded-3xl`, dark background with backdrop blur — used for quick actions (invite member, add budget entry, create event) rather than full-page navigations.
- Navbar: top bar with dark background and bottom border, present above the main content area (not above the sidebar).
- Responsive: sidebar collapses to a bottom bar or hamburger on small screens; the board and canvas scroll horizontally on mobile rather than reflowing into a list.

## Icons

Lucide React. Stroke-based icons only — no filled variants. Icon sizes: `h-4 w-4` for inline, `h-5 w-5` for buttons, `h-8 w-8` for feature icons in empty states.
