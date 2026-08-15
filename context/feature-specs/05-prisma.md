# Prisma Schema And Data Layer

## Before Starting

Check the current state of the project before doing anything below. For each item, if it already exists and matches what's described, skip it — do not recreate, duplicate, or overwrite working code:

- Does `prisma/schema.prisma` or `prisma/models/*.prisma` already define any of the models below? If some exist and others don't, only add the missing ones.
- Does `lib/prisma.ts` already export a cached Prisma client? If it already branches correctly on `DATABASE_URL`, leave it alone.
- Do `lib/org-scope.ts` and/or `lib/institution-scope.ts` already exist and work as described? If so, skip recreating them.
- Has a migration already been run? If `prisma/migrations/` has entries covering these models, don't re-run `migrate dev` from scratch — only migrate the delta.

State clearly at the end which parts were skipped because they already existed, versus which parts you actually created.

## Goal

Prisma is already installed, and DATABASE_URL points to a real Postgres database. Add every data model needed for institutions, union approvals, and the club workspace, the Prisma client singleton, and the first migration. Clubs' membership and roles are Clerk Organizations — do not model those locally. Everything below is scoped by either `institutionId` or a club's own Clerk organization ID, depending on which layer it belongs to.

## Institution & Union Models

Create `prisma/models/institution.prisma` (skip if it already exists with these fields).

Add `Institution`:
- name
- slug (unique)
- timestamps
- index on slug

Add `UnionStaffOrgLink`:
- `clerkOrgId` (unique) — the Clerk Organization ID for this institution's union staff
- institution relation
- timestamps
- index on institution ID

## Configurable Forms

Create `prisma/models/form-schema.prisma` (skip if it already exists with these fields).

Add `FormSchema`:
- institution relation
- form type enum: `CLUB_APPLICATION`, `EVENT_APPROVAL`, `FUNDING_REQUEST`
- `fields` (JSON) — ordered array of field definitions: `{ fieldKey, label, type, required, options?, helpText? }`
- timestamps
- unique constraint on institution + form type
- index on institution ID

## Club & Applications

Create `prisma/models/club.prisma` (skip if it already exists with these fields).

Add `Club`:
- institution relation
- `clerkOrgId` (unique)
- approval status enum: `PENDING`, `APPROVED`, `REJECTED`
- optional description
- baseline budget amount (decimal)
- `brainstormCanvasJsonPath` — for future Vercel Blob snapshot reference
- timestamps
- index on institution ID, index on `clerkOrgId`

Add `ClubApplication`:
- institution relation
- `answers` (JSON) — submitted field values keyed by fieldKey
- `schemaSnapshot` (JSON) — copy of the FormSchema fields at submission time
- status enum: `PENDING`, `APPROVED`, `REJECTED`
- proposed admin (Clerk user ID, string) and proposed admin email
- resulting club relation (nullable — set once approved and the Club record is created)
- timestamps
- index on institution ID, index on institution ID + status

## Event & Funding Approval Requests

Create `prisma/models/approvals.prisma` (skip if it already exists with these fields).

Add `EventApprovalRequest`:
- club relation
- `answers` (JSON), `schemaSnapshot` (JSON)
- status enum: `PENDING`, `APPROVED`, `REJECTED`
- optional resulting event relation (nullable — set once approved and the Event record exists)
- timestamps
- index on club ID, index on club ID + status

Add `FundingRequest`:
- club relation
- amount (decimal), `answers` (JSON), `schemaSnapshot` (JSON)
- status enum: `PENDING`, `APPROVED`, `REJECTED`
- timestamps
- index on club ID, index on club ID + status

## Club Workspace Models

Create `prisma/models/event.prisma` (skip if it already exists with these fields).

Add `Event`:
- club relation
- title
- optional description, location
- status enum: `IDEA`, `PLANNING`, `CONFIRMED`, `DONE`
- date/time (nullable)
- timestamps
- index on club ID, index on club ID + status

Add `EventTask`:
- event relation with cascade delete
- title
- assignee (Clerk user ID, string, nullable)
- done boolean, default false
- timestamps
- index on event ID

Create `prisma/models/budget.prisma` (skip if it already exists with these fields).

Add `BudgetCategory`:
- club relation
- name
- allocated amount (decimal)
- timestamps
- index on club ID

Add `BudgetEntry`:
- club relation
- optional category relation (nullable FK, set null on category delete)
- optional event relation (nullable FK, set null on event delete)
- amount (decimal)
- type enum: `INCOME`, `EXPENSE`
- optional note
- date
- `receiptUrls` (string array) — Vercel Blob references, only meaningful for `EXPENSE` entries
- timestamps
- index on club ID, index on club ID + date

Create `prisma/models/brainstorm.prisma` (skip if it already exists with these fields).

Add `BrainstormIdea` (only for ideas promoted out of the freeform canvas — the canvas itself lives in a Blob snapshot referenced by `Club.brainstormCanvasJsonPath`):
- club relation
- text
- vote count, default 0
- timestamps
- index on club ID

Do not add extra fields unless required by Prisma.

## Prisma Client

Create `lib/prisma.ts` as a cached singleton (skip if it already does this correctly).

Branch by `DATABASE_URL`:
- if it starts with `prisma+postgres://`, use Accelerate
- otherwise use direct `@prisma/adapter-pg`

Cache the client on `global` in development for hot reloads.

## Scoping Helpers

Create `lib/org-scope.ts` (skip if it already exists and works): a helper that reads the active Clerk organization ID from the current session and throws if none is active — used by every club-workspace query (Event, EventTask, BudgetCategory, BudgetEntry, BrainstormIdea all resolve through a Club found by its `clerkOrgId`).

Create `lib/institution-scope.ts` (skip if it already exists and works): a helper that resolves the current Institution from the active Clerk organization via `UnionStaffOrgLink`, and throws if the active org isn't a recognized Union Staff org — used by every union-dashboard query (FormSchema, ClubApplication, EventApprovalRequest, FundingRequest).

These two helpers must never be interchanged — a union route resolving institution scope and a club route resolving org scope are fundamentally different checks.

## Migration

Run the migration and generate the client. If migrations already cover some of these models, only migrate what's new or changed — do not reset the database.

## Dependencies

Already installed: `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`.

## Check When Done

- schema has all models above with correct relations, enums, and indexes
- no local Club membership/role table exists — Clerk remains the source of truth for that
- `lib/prisma.ts` exports one cached Prisma instance
- `lib/org-scope.ts` and `lib/institution-scope.ts` both exist, are distinct, and each throws when its respective active context is missing
- migration runs successfully
- `npm run build` passes
- summary states what was skipped (already existed) vs. newly created