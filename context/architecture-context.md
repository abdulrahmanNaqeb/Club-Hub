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
| Artifact storage | Vercel Blob              | Brainstorm snapshots, receipts, and generated approval letters      |

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

- **Database**: institutions, union staff org links, clubs (with approval status), club applications, event approval requests, funding requests, form schemas, events, event tasks, budget categories/entries, promoted brainstorm items and issue tasks — all relational.
- **Vercel Blob**: brainstorm canvas snapshots (`brainstorm/{clubId}.json`), budget-entry receipt files (`receipts/{clubId}/{budgetEntryId}/{filename}`), and generated approval PDFs (`approval-documents/{club|event|funding}/{recordId}.pdf`).
- Blob URLs are stored as references in the database — `brainstormCanvasJsonPath` on the club record, `receiptUrls` (string array) on the budget entry record, and nullable `generatedDocumentUrl` fields on `ClubApplication`, `EventApprovalRequest`, and `FundingRequest`.
- Blob access is selected centrally through `BLOB_ACCESS_MODE` (`public` or `private`) and must match the store's fixed access type. Development currently uses `public`; production must use a private store and set `BLOB_ACCESS_MODE=private`. Receipt and approval-letter delivery always remains behind authenticated proxy routes in either mode; raw approval-document Blob URLs are not sent to client components.

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
- Budget-entry deletion, budget-category deletion, and funding-request submission additionally require the active Clerk membership role to be `org:admin`. Other club collaboration remains open to members.
- Liveblocks room tokens (Events board, Brainstorm canvas) are issued only after verifying club org membership AND approved status.

## Approval & Funding Data Model (high level — full schema in the Prisma spec)

- `Institution` — university/union record.
- `UnionStaffOrgLink` — maps a Clerk org ID to an `Institution` (so we can resolve institution from the active Clerk org on union routes).
- `FormSchema` — institution + form type + ordered field definitions (see "Configurable Forms" above).
- `ClubApplication` — the submitted form; `answers` + `schemaSnapshot` JSON; status `PENDING` / `APPROVED` / `REJECTED`; nullable generated approval-letter URL. Submitter identity is stored separately from proposed-admin identity. If the proposed admin email is not already a verified email on the submitter's Clerk account, a 48-hour confirmation link must be completed by a signed-in Clerk user who owns that verified address. Approval is blocked until this succeeds. On approval, creation of the Club's Clerk org and Prisma `Club` record is coordinated as described below.
  
	Idempotent approval behavior: external side effects (Clerk organization creation/invitations) and the Prisma `Club` record are treated as coordinated steps with durable intent recorded on the `ClubApplication`. The system should:

	- Record an explicit operation/state on the `ClubApplication` (for example `claimToken`, `operationId`, or an `inProgress` timestamp) before making external calls so retries can detect work already started.
	- Detect partial outcomes by consulting the durable operation record or Clerk metadata and reconcile the missing counterpart rather than blindly retrying and risking duplicates (e.g. if the Clerk org exists but the Prisma `Club` does not, create the missing `Club` record; if the Prisma `Club` exists but no Clerk org, reattempt org creation or mark for manual reconciliation).
	- Provide a compensating cleanup path (delete orphaned Clerk orgs or mark applications with a reconciliation-needed flag) and an automated reconciliation job for operators/backfill that can bring the system to a consistent final state.

	This avoids relying on a brittle "never partially" guarantee and makes approval operations safe to retry under transient failures.
- `Club` — `institutionId`, `approvalStatus`, cumulative union-approved `availableBudgetAmount`, `brainstormCanvasJsonPath`. The amount starts with the baseline entered during club approval and increases when later funding requests are approved.
- `EventApprovalRequest` — `answers` + `schemaSnapshot` JSON; status `PENDING` / `APPROVED` / `REJECTED`. Separate from funding.
- `FundingRequest` — `answers` + `schemaSnapshot` JSON (defaults to amount + reason); status `PENDING` / `APPROVED` / `REJECTED`; nullable generated approval-letter URL; on approval, increases the club's tracked available budget. `EventApprovalRequest` and `ClubApplication` carry the same document URL field. PDF generation happens only after the approval commits, and generation failure is logged without reverting or blocking the underlying decision.
- Standard club-workspace models (Event, EventTask, BudgetCategory, BudgetEntry, BrainstormIdea) as previously spec'd, with `BudgetEntry` additionally carrying `receiptUrls` (string array, Vercel Blob references) for expense entries.
- `BrainstormIdea` / `BrainstormIdeaTask` / the planning fields on `Event` — the Brainstorm → Plan → Event workflow. Full description in `feature-specs/20b-brainstorm-plan-event-workflow.md` (written retroactively; that spec is the reference, not the tracker entry). In short: `BrainstormIdea` is the structured intake/decision record created when one or more freeform Liveblocks notes are promoted — typed `EVENT` or `ISSUE`, carrying votes, a decision lifecycle, and source note IDs for provenance. Issues own `BrainstormIdeaTask` action items and never become events. An event-type idea links to at most one `Event` through unique `Event.sourceIdeaId`.
- Once an event idea starts planning, `Event` is the canonical cross-surface plan: title/brief, lifecycle status, date/time, location, estimated cost, equipment/logistics notes, poster/promotion notes, and `EventTask` checklist. Brainstorm, Events Board, Calendar, and the final Plan preview serialize that same Event row; they must not maintain copied event fields. Plan readiness has one definition, in `lib/event-plan.ts`.

## Branding

Both Union Staff orgs and Club orgs are Clerk Organizations, and Clerk already provides logo/image management for organizations (part of `OrganizationProfile`). There is no custom logo upload to build — `organization.imageUrl` is read wherever branding is shown, with an initials-based fallback when unset. This applies identically whether it's the union's logo or a club's logo.

## Invariants

1. Request handlers do not run long-lived work (emails, scheduled jobs, overspend recalculation) — that belongs in background tasks.
2. Every query is scoped correctly for its context: union routes by `institutionId` (verified via Union Staff org membership), club routes by the club's Clerk `organizationId` (verified via Club org membership). Crossing these — e.g. a union query trusting a club-supplied ID without checking the `institutionId` link — is treated as a data-leak bug, not a style issue.
3. A club's workspace routes are inert unless `approvalStatus == APPROVED`. `getActiveClub()` enforces this for APIs and `requireOrgMode("club")` enforces it for pages.
4. Approving a `ClubApplication` creates the Clerk org and the Prisma `Club` record as a single transaction-like step — the system must never end up with one but not the other.
5. Funding approvals only ever increase a club's tracked budget by the approved headline amount — the union never needs (and the system never requires) itemized spend data to approve funding.
6. A submission's `schemaSnapshot` is immutable once created — editing a `FormSchema` later must never alter how a past submission is displayed or validated.
7. Client components are used only where browser interactivity or real-time state requires them.
8. Liveblocks is used only for the Events board and Brainstorm canvas — no other view depends on real-time infrastructure.
9. Starting an event from Brainstorm is idempotent: a unique source-idea relation plus one database transaction guarantees at most one Event per structured idea. Concurrent retries converge on the existing Event.
10. The Events Board, Calendar, and Plan preview share one canonical event state in the workspace. Status changes made outside the Board must reconcile the Liveblocks ordering to Prisma's Event status rather than leaving the card in a stale column.
