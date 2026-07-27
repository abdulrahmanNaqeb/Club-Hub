Build the club application page — where a student fills out and submits an application to start a new club, using their institution's configured CLUB_APPLICATION form schema.

## Route & Access

Route: `/apply/[institutionSlug]`. Must be a signed-in Clerk user (any user, doesn't need to belong to any org yet) — unauthenticated visitors redirect to `/sign-in` and back here after signing in.

Look up the `Institution` by slug. If it doesn't exist, show a simple "This institution isn't set up yet" message — not a generic 404.

## Reusable Dynamic Form Renderer

Extract the field-rendering logic from `06-form-schema-builder.md`'s builder into a shared component: `components/forms/dynamic-form.tsx`, taking a `FormSchema.fields` array and rendering the appropriate shadcn input per field type (Short text → `Input`, Long text → `Textarea`, Number → `Input type=number`, Yes/No → a toggle or radio pair, Single select → `Select`, Date → a date input). This component will be reused by event-approval and funding-request submission flows in later specs — build it generically now rather than one-off.

Skip File upload fields for this unit — render a disabled placeholder input with "File uploads coming soon" if one exists in the schema. Full file handling is a separate, focused piece of work, not something to bolt on here. Required `File upload` fields must be treated as non-blocking for validation in this unit: either the builder should disable the required toggle for `File` fields, or the dynamic renderer/validation should ignore `File` fields when enforcing required constraints until uploads are supported.

## Schema Loading

Reuse (don't duplicate) the same "seed defaults if missing" logic from `06-form-schema-builder.md` — extract it into a shared helper if it isn't already, e.g. `lib/get-or-seed-form-schema.ts`, used by both the union's builder and this public application page.

## Reserved Field

The CLUB_APPLICATION schema's seeded defaults include a field with a fixed, reserved `fieldKey: "proposedAdminEmail"`. This key must always exist in any CLUB_APPLICATION schema — when building this spec, add a guard: if a union has edited their schema and this field is missing, fall back to using the submitting Clerk user's own email as the proposed admin email, and log a warning server-side. Don't block submission over this — degrade gracefully.

## Submission

On submit:
- validate all `required` fields are filled, matching the schema's field types
- build the `answers` JSON keyed by `fieldKey`
- snapshot the current schema's fields into `schemaSnapshot`
- pull `proposedAdminEmail` (with the fallback above) into `ClubApplication.proposedAdminEmail`
- create the `ClubApplication` row: institution relation, status `PENDING`, `answers`, `schemaSnapshot`, `proposedAdminEmail`
 - persist the submitting Clerk user's id in `ClubApplication.proposedAdmin` in addition to `proposedAdminEmail` (the `proposedAdmin` field is the authoritative identity reference; a separate submitted `admin-name` field may still be captured for display only)
 - create the `ClubApplication` row: institution relation, status `PENDING`, `answers`, `schemaSnapshot`, `proposedAdminEmail`, and `proposedAdmin`
- redirect to a simple confirmation screen: "Application submitted — you'll hear back once [institution name]'s union reviews it." No queue-viewing for the applicant yet — that's a union-side concern, later spec.

## API

`POST /api/institutions/[institutionSlug]/applications` — validates, creates the `ClubApplication`. Returns 404 if the institution doesn't exist, 400 on validation failure.

## Scope Limits

- don't build the union-side approval queue yet — that's `09-club-application-queue.md`
- don't wire real file uploads — placeholder only
- don't add a "my applications" view for the applicant — out of scope for now
- don't touch `06-form-schema-builder.md`'s builder UI beyond extracting the shared component and seeding helper

## Check When Done

- `/apply/[institutionSlug]` renders the real, current CLUB_APPLICATION schema for that institution, including any customizations a union has made
- required-field validation works both client and server side
- submitting creates a correctly-populated `ClubApplication` with the right `proposedAdminEmail`
- the fallback for a missing reserved field works and doesn't crash submission
- confirmation screen shows after successful submit
- `npm run build` passes