Replace the default create-next-app color setup in `app/globals.css` with the real dark-only theme defined in `context/ui-context.md`. This must run before `01-design-system.md` — that spec assumes these tokens already exist.

## Problem

`globals.css` currently has the default light/dark toggle from `create-next-app` (`--background: #ffffff`, switching via `prefers-color-scheme`). This app has no light mode — it's dark-only, and the actual palette lives in `context/ui-context.md`.

## Implementation

Replace the `:root` block, the `@theme inline` block, and remove the `@media (prefers-color-scheme: dark)` block entirely — there is no light mode, so there's nothing to switch between.

Define these as CSS custom properties on `:root`, using the exact values from `context/ui-context.md`:

- `--bg-base`, `--bg-surface`, `--bg-elevated`, `--bg-subtle`
- `--border-default`, `--border-subtle`
- `--text-primary`, `--text-secondary`, `--text-muted`, `--text-faint`
- `--accent-primary`, `--accent-primary-dim`
- `--accent-secondary`, `--accent-secondary-text`
- `--state-error`, `--state-success`, `--state-warning`

Map each one into the `@theme inline` block so Tailwind utilities are generated from them (e.g. `--color-bg-base: var(--bg-base);` so `bg-base` works as a Tailwind class — follow the same `--color-*` naming pattern Tailwind v4 uses for the existing `--color-background`/`--color-foreground` mapping).

Keep the existing font variable mapping (`--font-sans`, `--font-mono` → `--font-geist-sans`, `--font-geist-mono`) as-is — that part doesn't change.

Update the `body` rule to use the new tokens: `background: var(--bg-base)`, `color: var(--text-primary)`.

## Scope Limits

- don't touch `layout.tsx` or `page.tsx` — this is `globals.css` only
- don't install shadcn or any components yet — that's the next spec
- don't invent new color values — use exactly what's in `context/ui-context.md`

## Check When Done

- `globals.css` has no `@media (prefers-color-scheme: dark)` block left
- every color token from `context/ui-context.md`'s theme table exists as a CSS variable and a matching Tailwind utility (e.g. `bg-base`, `text-copy-primary` per the naming convention in `code-standards.md`)
- `body` renders dark by default with no light-mode flash
- `npm run build` passes
