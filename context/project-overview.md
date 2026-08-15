# ClubOS

*(placeholder name — rename everywhere once a real name is picked)*

## Overview

ClubOS is a two-sided platform. **Student Unions** (one per university) get an oversight dashboard for approving clubs, admins, events, and funding — replacing paper forms and manual spreadsheet tracking with faster approvals and real budget visibility. **Clubs**, once approved, get a private workspace to run their day-to-day operations: members, events, and budget/brainstorming.

The union is the buyer. The club-facing UI is what makes clubs actually want to use it, which is what makes the union's oversight data real and current instead of stale.

## Who uses it

- **Student Union reviewers** — university staff/student-gov members who approve club applications, event requests, and funding requests, and monitor spend across every club at their institution. Multiple universities use the platform independently; a union at one institution never sees another institution's data.
- **Club admins** — run one approved club day-to-day: manage members, events, tasks, and budget within whatever the union has funded.
- **Club members** — the regular participant experience: see the team, join events, complete tasks, contribute to brainstorming.

There is no cross-institution visibility anywhere in the product, for anyone.

## Multi-tenancy model (two levels)

- **Institution** — a university's Student Union. Not a Clerk concept; a record we own (name, slug). All approval queues and budget oversight are scoped to one institution.
- **Union Staff** — a Clerk Organization, one per institution. Being a member of it is what makes someone a reviewer for that institution's queues. (Clerk Organizations don't nest, so a club cannot literally "belong to" a union org — the link is a plain `institutionId` foreign key instead.)
- **Club** — its own Clerk Organization, same as before, now carrying an `institutionId` and an `approvalStatus` (pending / approved / rejected). A club's workspace is inert until approved.
- **Club Admin / Member** — Clerk org roles within the club, unchanged from the original design.

## Core flows

### Club application (replaces the union's paper form)

1. A student fills out a structured application — the exact fields are defined by that institution's editable form schema (see "Configurable Forms" below), not hardcoded. A sensible starter schema (club name, description/purpose, category, proposed admin name + email, expected member count) is provided by default, and a union can edit it.
2. This creates a `ClubApplication` record with status `pending`, tied to the institution, storing the applicant's answers against whatever the schema looked like at submission time.
3. A union reviewer sees it in their approval queue and approves or rejects it — **as one review**, covering both the club and its proposed admin together (not two separate steps).
4. On approval: the Clerk Organization for the club is created, the proposed admin is set as its admin, and the club's workspace becomes usable.
5. On rejection: the applicant is notified; no club or org is created.

### Configurable Forms

Every union's paper process asks different questions, so the club application, event approval, and funding request forms are **schema-driven, not hardcoded** — a union can add, remove, reorder, or relabel fields for each form type from their dashboard.

- Starter defaults are provided per form type so a union isn't starting from a blank form. For event approval, the default schema includes fields like "Will there be a presentation?", "Speaker name(s)", and "Are there physical activities?" — matching what unions commonly ask on paper — but any union can change these.
- Field types supported: short text, long text, number, yes/no, single-select, date, file upload.
- Every submission stores a snapshot of the schema it was answered against, alongside the answers — so editing a form later never breaks how past submissions are displayed.

### Event approval

- A club submits an event for approval using that institution's event-approval form schema (date, location, description, plus whatever custom fields the union has configured — presentation/speakers/physical-activities by default).
- A union reviewer approves/rejects independently of any funding request.

### Funding requests

- A club submits a funding request: an amount and a reason (also schema-driven per institution, defaulting to just amount + reason). The union reviews at the headline dollar-amount level only — not itemized line items.
- On approval, the amount is added to the club's tracked budget as an allocation.
- Clubs also start with a baseline budget the union sets when approving the club (e.g. a per-semester amount), separate from one-off requests.

### Overspending / reconciliation

- The system flags a club automatically when tracked spend exceeds everything ever approved for them (baseline + approved requests).
- Flagged clubs appear in the union's dashboard for reconciliation — the club explains/justifies the overage before further funding requests are considered.

### Club-side day-to-day (once approved)

- **Team**: member list, roles, leaderboard, admin-managed via Clerk's own member-management UI.
- **Events**: board view (status columns) + calendar view of the same data; each event has a checklist with assignees.
- **Budget**: categories, entries (income/expense), linked to events, running totals, tied back to whatever the union has approved. Expense entries can attach one or more receipt files (image or PDF) as proof of spend — this matters directly for the overspend/reconciliation story.
- **Brainstorm**: real-time freeform canvas, promotable to a ranked list.

### Branding

Both unions and clubs are Clerk Organizations, and Clerk Organizations already have a built-in logo/image field with its own management UI (part of `OrganizationProfile`). There is no custom logo uploader to build — the app just needs to consistently display `organization.imageUrl` wherever branding appears (union dashboard header, club sidebar), with a sensible fallback (initials) when none is set.

## Scope

### In Scope

- Institution + Union Staff setup (one union org per university, fully isolated)
- Configurable, schema-driven forms for club applications, event approvals, and funding requests — editable per institution, with sensible starter defaults
- Club application flow (structured form, single combined approval)
- Event approval queue
- Funding request queue + baseline budget setting
- Overspending detection and reconciliation flagging
- Receipt attachments on budget expense entries
- Club workspace: Team, Events (board + calendar), Budget, Brainstorm — as previously spec'd
- Event reminder and weekly digest background jobs

### Out Of Scope

- Public-facing club or union pages
- Actual payment processing/disbursement (budget tracking is bookkeeping and approval status, not moving real money)
- Mobile-native applications
- Custom roles beyond Union Reviewer / Club Admin / Club Member
- AI-generated content or AI-assisted planning
- Appeals workflows or multi-step approval chains (single reviewer decision per request, for now)

## Success Criteria

1. A student can submit a club application through a form that mirrors what their union already asks for, and a union reviewer can approve or reject it in one action.
2. A union reviewer can see every pending club/event/funding request for their institution, and nothing from any other institution.
3. Approving a funding request correctly increases a club's tracked budget without requiring the union to see itemized spend.
4. A club that overspends what's ever been approved for them is automatically flagged for the union to see.
5. Once approved, a club's day-to-day workspace (Team/Events/Budget/Brainstorm) works exactly as previously spec'd.
