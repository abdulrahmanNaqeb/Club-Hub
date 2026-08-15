Clerk is already installed and connected, with the Organizations feature enabled. Wire it into the Next.js app: provider, auth pages, org selection, redirects, route protection, and user menu.

## Important — temporary scaffolding note

This app will eventually have two kinds of Clerk Organization (Union Staff orgs and Club orgs), and club creation will only ever happen through a reviewed application — never self-serve. But that logic depends on data that doesn't exist yet (Institution/Club records come in `05-prisma.md`, the application flow comes in Phase 1). Until then, this spec uses Clerk's own self-serve "create or join an organization" screen just so there's something to authenticate against and test with. Do not treat this as the final flow — it will be replaced.

## Design

Use Clerk's `dark` theme from `@clerk/ui/themes` as the base.

Override Clerk appearance variables using the app's existing CSS variables. Do not hardcode colors.

Sign-in and sign-up pages:

- large screens: simple two-panel layout
- left: compact logo, tagline, short text-only feature list
- right: centered Clerk form
- small screens: form only
- no gradients
- no oversized hero sections
- no feature cards
- no scroll-heavy layouts

Keep the layout minimal and professional.

## Implementation

Wrap the root layout with `ClerkProvider` using Clerk's `dark` theme.

Create sign-in and sign-up pages using Clerk components.

Use `proxy.ts` at the project root, not `middleware.ts`.

Define public routes using the existing sign-in and sign-up env vars. Protect everything else by default.

### Organization handling (temporary — see note above)

- authenticated users with no active organization redirect to `/select-club`, a minimal screen with Clerk's `OrganizationList` (create or join — temporary stand-in for the real application flow)
- authenticated users with an active organization redirect to `/team`
- unauthenticated users redirect to `/sign-in`

Add Clerk's `OrganizationSwitcher` to the sidebar's club switcher slot (built as a placeholder in `02-app-chrome.md`), styled to match the existing sidebar via appearance overrides — not a custom-built switcher.

Add Clerk's built-in `UserButton` to the sidebar's user menu slot for profile settings and logout.

Keep Clerk's default user menu, org switcher, and profile flows intact. Do not rebuild or heavily customize Clerk internals.

Use existing Clerk env vars. Do not rename or invent new ones.

## Dependencies

install: `@clerk/ui`.

## Check When Done

- `proxy.ts` exists at the root
- all routes are protected except public auth paths
- users with no active organization land on `/select-club`
- auth pages use CSS variables with no hardcoded colors
- `ClerkProvider` wraps the root layout
- `OrganizationSwitcher` and `UserButton` are wired into the sidebar's existing placeholders
- `npm run build` passes