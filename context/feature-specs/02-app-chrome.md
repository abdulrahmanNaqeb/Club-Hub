We need the base chrome components that frame every authenticated screen — the top navbar and the left sidebar. These will be reused and extended in every chapter that follows.

### App Navbar

Create `components/app/app-navbar.tsx`.

Requirements:

- fixed-height top navbar
- left, center, and right sections
- left section shows the current section title (e.g. "Team", "Events", "More") — static text for now, no routing logic yet
- right section stays empty for now
- dark background with subtle bottom border

---

### App Sidebar

Create `components/app/app-sidebar.tsx`.

Requirements:

- persistent, not floating — always visible on desktop, does not overlay content
- sits on `bg-surface` with a `border-default` right edge
- top: club switcher placeholder (button styled like a dropdown trigger, no real switching logic yet)
- middle: main nav with three items — Team, Events, More — each with a `lucide-react` icon, using shadcn/ui nav patterns
- bottom: user menu placeholder (avatar + name, no real menu yet)
- on small screens: collapses to a bottom bar or is hidden behind a hamburger toggle in the navbar's left section

---

### Dialog Pattern

Use the existing color tokens from `globals.css` for dialog styling.

Support:

- title
- description
- footer actions

Do not build actual dialogs yet.

### Check when done

- new components compile without TypeScript errors
- no lint errors
- sidebar is persistent (does not overlay or push content unexpectedly)
- dialog pattern is ready for future use