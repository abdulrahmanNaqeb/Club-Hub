The app sidebar and navbar currently only know one "mode" — a club workspace (Team/Events/More). Fix this: detect whether the active Clerk organization is a Union Staff org or a Club org, and render the correct navigation for each.

## Org Mode Detection

Create `lib/get-org-mode.ts`: given the active Clerk organization ID, determine which of three states applies:
- `union` — a `UnionStaffOrgLink` exists for this org ID (resolve and return the linked `Institution` too)
- `club` — a `Club` exists with this `clerkOrgId` (resolve and return the `Club` record too)
- `none` — neither (shouldn't normally happen post-onboarding, but handle it: show a simple "This organization isn't set up" state rather than crashing)

This is the single source of truth every other part of the chrome uses — don't re-derive org mode ad hoc elsewhere.

## Sidebar Changes

Extend `components/app/app-sidebar.tsx` (from `02-app-chrome.md`) — don't rebuild it, branch its nav section on org mode:

**Club mode** (unchanged): Team, Events, More.

**Union mode**: Applications, Events, Funding, Forms — each with a `lucide-react` icon, same visual treatment as the existing nav items. "Forms" links to the already-built `/union/forms`.

The top club-switcher slot works for both — Clerk's `OrganizationSwitcher` doesn't care which kind of org it's switching between, so no change needed there. But the icon/label context (e.g. a small "Union" vs "Club" badge near the org name) should make it visually obvious which mode you're in, since a user could plausibly belong to both kinds of org and switch between them.

## Navbar Changes

The navbar's left section (currently a static per-page title from `02-app-chrome.md`) should now reflect the real current page correctly for both modes — "Applications," "Events," "Funding," "Forms" in union mode; "Team," "Events," "More" in club mode.

## Placeholder Routes

Create three new placeholder pages, matching the exact placeholder pattern already used for Team/Events/More in earlier specs (a simple card: title + one line of description, no real content yet):

- `/union/applications` — "Club applications awaiting review will live here."
- `/union/events` — "Event approval requests will live here."
- `/union/funding` — "Funding requests will live here."

`/union/forms` already exists from `06-form-schema-builder.md` — don't recreate it, just make sure it's now reachable from the sidebar instead of only by typing the URL directly.

## Access

Union routes (`/union/*`) must redirect club-mode users away (and vice versa for club routes, if not already enforced) — reuse `lib/get-org-mode.ts` for this check, don't duplicate the Union Staff/Club membership logic that already exists in `lib/institution-scope.ts` and `lib/org-scope.ts`.

## Scope Limits

- don't build real content for any of the three new placeholder pages — that's `09`, `10`, `11`
- don't change how `OrganizationSwitcher` itself works
- don't add a platform-level "admin of admins" mode — only club and union, as already scoped

## Check When Done

- switching the active org between a Club org and the Test University Union Staff org changes the sidebar nav correctly, live
- `/union/forms` is now reachable from the sidebar
- the three new placeholder routes exist and render
- a club-mode user hitting `/union/*` (or vice versa) is redirected, not shown a broken/wrong-context page
- `npm run build` passes