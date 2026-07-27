Build the form schema builder — the screen where a union reviewer defines and edits the fields on their institution's club application, event approval, and funding request forms.

## Access

This route must be a server component, protected by `lib/institution-scope.ts` — only members of a Union Staff org (resolved via `UnionStaffOrgLink`) can access it. Anyone else gets redirected or shown an access-denied state (reuse the pattern from `AccessDenied`-style components if one already exists from auth work; otherwise a simple centered message is fine for now).

There is no union dashboard chrome yet (that's a later spec) — build this as a standalone route for now, e.g. `app/union/forms/page.tsx`. It will get wired into real navigation later.

## Seeding Defaults

If no `FormSchema` exists yet for the current institution + a given form type, create one on first load with these starter fields (don't wait for the union to build from scratch):

**CLUB_APPLICATION**: club name (text, required), description (textarea, required), category (select, required — options: Academic, Cultural, Sports, Service, Other), proposed admin name (text, required), proposed admin email (text, required), expected member count (number, required).

**EVENT_APPROVAL**: event name (text, required), date (date, required), location (text, required), description (textarea, required), will there be a presentation (boolean, required), speaker name(s) (text, optional), are there physical activities (boolean, required).

**FUNDING_REQUEST**: amount (number, required), reason (textarea, required).

## Builder UI

Three tabs (shadcn `Tabs`), one per form type. Each tab shows:

- the current ordered list of fields for that form type, each row showing label, type, and a required badge
- drag-to-reorder (or up/down buttons if drag adds too much complexity for this unit — either is fine)
- an "Add field" button opening a `Dialog` with: label, field type (`Select`: Short text, Long text, Number, Yes/No, Single select, Date, File upload), required toggle, options list (only shown/editable when type is Single select), optional help text
 - an "Add field" button opening a `Dialog` with: label, field type (`Select`: Short text, Long text, Number, Yes/No, Single select, Date, File upload), required toggle, options list (only shown/editable when type is Single select), optional help text
	 - FILE fields: the UI must disable the `required` toggle for `File upload` fields (upload handling is not yet supported). If a field's type is changed to `File upload`, the builder should clear any existing `required` flag for that field.
- click a field row to edit it in the same dialog, prefilled
- a delete action per field, with a simple confirm (destructive-styled button, no need for a separate confirmation dialog for this unit)
- a "Save changes" action that persists the full ordered field list back to `FormSchema.fields`

## API

- `GET /api/union/forms/[formType]` — returns the current schema for the active institution, seeding defaults first if none exists
- `PUT /api/union/forms/[formType]` — replaces the full field list; validate `formType` is one of the three enum values and that the request is scoped to the correct institution via `lib/institution-scope.ts`

## Scope Limits

- don't build the actual application/approval submission forms yet — that's `07-club-application-flow.md` and later specs
- don't build union dashboard navigation/chrome — later spec
- don't add field-level conditional logic (e.g. "show this field only if that one is checked") — flat ordered list only, for now

## Check When Done

- accessing `/union/forms` without Union Staff org membership is blocked
- all three form types seed sensible defaults on first access
- fields can be added, edited, reordered, and deleted
- saving persists correctly and reloading shows the saved state, not the defaults again
- `npm run build` passes