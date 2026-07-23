# Architecture Context

## Stack

| Layer            | Technology              | Role                                                              |
| ---------------- | ------------------------ | ------------------------------------------------------------------ |
| Framework        | Next.js 16 + TypeScript  | Full-stack app with server/client boundaries                       |
| UI               | Tailwind + shadcn/ui     | Component composition and styling                                  |
| Auth             | Clerk (Organizations)    | User identity, org membership, and route protection                |
| Database         | Prisma + PostgreSQL      | Institutions, clubs, applications, approvals, events, budget       |
| Real-time        | Liveblocks               | Live Events board and Brainstorm canvas — presence, cursors, state |
| Background tasks | Trigger.dev              | Event reminders, digest emails, overspend-flag checks               |
| Artifact storage | Vercel Blob              | Brainstorm canvas snapshots                                        |

## Tenancy Model (two levels — read this carefully, it drives everything)

Clerk Organizations are flat — they cannot nest. A club cannot literally "belong to" a union's Clerk org. Instead:

- **Institution** — a plain Prisma record (`id`, `name`, `slug`). Represents one university's Student Union. Not a Clerk object. This is the top-level scope for all union-facing data.
- **Union Staff org** — one Clerk Organization per Institution, created when a union signs up. A user's membership in this org is what makes them a reviewer for that institution. Every union-facing query is scoped by the Institution ID resolved from this org.
- **Club** — its own Clerk Organization, exactly as originally designed (Admin/Member roles, workspace, etc.), but now every `Club` Prisma record also carries an `institutionId` (FK to Institution) and an `approvalStatus`. A club with `approvalStatus != APPROVED` has no usable workspace — its routes redirect to a pending/rejected state instead of rendering Team/Events/Budget/Brainstorm.

There is no Clerk-level relationship between a Union Staff org and a Club org. The only link is the `institutionId` column. **Every query must double-check this link explicitly** — a club's Clerk org ID alone does not prove which institution it belongs to; always join through the `Club` table's `institutionId`.

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, org/institution-ownership checks, job triggering, and persistence.
- `trigger` — Background jobs: reminder notifications, digest emails, overspend-flag recalculation.
- `lib` — Shared infrastructure: Prisma client, org-scoping and institution-scoping helpers, utilities.
- `components` — UI composition: union dashboard surfaces (approval queues), club surfaces (Team/Events/Budget/Brainstorm), shared chrome.
- `prisma` — Database schema and generated client output.

## Storage Model

- **Database**: institutions, union staff org links, clubs (with approval status), club applications, event approval requests, funding requests, form schemas, events, event tasks, budget categories/entries, promoted brainstorm ideas — all relational.
- **Vercel Blob**: brainstorm canvas snapshots (`brainstorm/{clubId}.json`) and budget-entry receipt files (`receipts/{clubId}/{budgetEntryId}/{filename}`). These are the only two large/unstructured artifact types in this app.
- Blob URLs are stored as references in the database — `brainstormCanvasJsonPath` on the club record, `receiptUrls` (string array) on the budget entry record.

## Configurable Forms

Club applications, event approvals, and funding requests are **schema-driven**, not hardcoded fields, because the questions differ per institution.

- `FormSchema` — one per institution per form type (`CLUB_APPLICATION` / `EVENT_APPROVAL` / `FUNDING_REQUEST`). Holds an ordered list of field definitions as JSON: `{ fieldKey, label, type, required, options?, helpText? }`. Field types: `TEXT`, `TEXTAREA`, `NUMBER`, `BOOLEAN`, `SELECT`, `DATE`, `FILE`.
- Starter defaults are seeded per form type when an institution is created (e.g. event approval defaults to presentation/speakers/physical-activities style fields), and a union can edit their own schema from their dashboard.
- Every submission (`ClubApplication`, `EventApprovalRequest`, `FundingRequest`) stores two things: the answers (`answers` JSON, keyed by `fieldKey`) and a **snapshot of the schema it was answered against** (`schemaSnapshot` JSON, a copy of the field definitions at submission time). This is deliberate: editing a form later must never change how a past submission renders or validates. Never join a historical submission back to the live `FormSchema` row for display — always read its own snapshot.
- File-type fields (e.g. an attachment on a funding request) upload to Vercel Blob the same way receipts do, and store the resulting URL in the submission's `answers` JSON under that field's key.

## Auth and Access Model

- Two distinct kinds of Clerk Organization exist in this app: **Union Staff orgs** (one per institution, reviewers only) and **Club orgs** (one per club, Admin/Member roles). A single Clerk user can belong to either kind, or both, but the app must always know which "mode" a given route is operating in — union dashboard routes resolve access via Union Staff org membership + institution ID; club workspace routes resolve access via Club org membership + approval status.
- Only authenticated users with the relevant active organization can access protected routes of that type.
- Every mutation to institution-scoped data (approval decisions, funding decisions) must verify the requester belongs to that institution's Union Staff org — never trust an `institutionId` passed from the client.
- Every mutation to club data must verify org membership AND that the club's `approvalStatus` is `APPROVED` (pending/rejected clubs cannot mutate workspace data even if someone is technically an org admin).
- Liveblocks room tokens (Events board, Brainstorm canvas) are issued only after verifying club org membership AND approved status.

## Approval & Funding Data Model (high level — full schema in the Prisma spec)

- `Institution` — university/union record.
- `UnionStaffOrgLink` — maps a Clerk org ID to an `Institution` (so we can resolve institution from the active Clerk org on union routes).
- `FormSchema` — institution + form type + ordered field definitions (see "Configurable Forms" above).
- `ClubApplication` — the submitted form; `answers` + `schemaSnapshot` JSON; status `PENDING` / `APPROVED` / `REJECTED`; on approval, triggers creation of the Club's Clerk org and Prisma `Club` record together, in one step — never partially.
- `Club` — `institutionId`, `approvalStatus`, baseline budget amount, `brainstormCanvasJsonPath`.
- `EventApprovalRequest` — `answers` + `schemaSnapshot` JSON; status `PENDING` / `APPROVED` / `REJECTED`. Separate from funding.
- `FundingRequest` — `answers` + `schemaSnapshot` JSON (defaults to amount + reason); status `PENDING` / `APPROVED` / `REJECTED`; on approval, increases the club's tracked available budget.
- Standard club-workspace models (Event, EventTask, BudgetCategory, BudgetEntry, BrainstormIdea) as previously spec'd, with `BudgetEntry` additionally carrying `receiptUrls` (string array, Vercel Blob references) for expense entries.

## Branding

Both Union Staff orgs and Club orgs are Clerk Organizations, and Clerk already provides logo/image management for organizations (part of `OrganizationProfile`). There is no custom logo upload to build — `organization.imageUrl` is read wherever branding is shown, with an initials-based fallback when unset. This applies identically whether it's the union's logo or a club's logo.

## Invariants

1. Request handlers do not run long-lived work (emails, scheduled jobs, overspend recalculation) — that belongs in background tasks.
2. Every query is scoped correctly for its context: union routes by `institutionId` (verified via Union Staff org membership), club routes by the club's Clerk `organizationId` (verified via Club org membership). Crossing these — e.g. a union query trusting a club-supplied ID without checking the `institutionId` link — is treated as a data-leak bug, not a style issue.
3. A club's workspace routes are inert unless `approvalStatus == APPROVED`. This check happens on every workspace route, not just at creation time.
4. Approving a `ClubApplication` creates the Clerk org and the Prisma `Club` record as a single transaction-like step — the system must never end up with one but not the other.
5. Funding approvals only ever increase a club's tracked budget by the approved headline amount — the union never needs (and the system never requires) itemized spend data to approve funding.
6. A submission's `schemaSnapshot` is immutable once created — editing a `FormSchema` later must never alter how a past submission is displayed or validated.
7. Client components are used only where browser interactivity or real-time state requires them.
8. Liveblocks is used only for the Events board and Brainstorm canvas — no other view depends on real-time infrastructure.
