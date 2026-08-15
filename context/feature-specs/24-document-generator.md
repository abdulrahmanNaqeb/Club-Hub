Build a document generator: auto-generate a simple PDF letter whenever a union approves a club application, event, or funding request — a tangible, official-feeling artifact, not just a status change in the app.

## Trigger Points

Hook into the three existing approval routes — don't build a new approval mechanism:
- `09-club-application-queue.md`'s approve flow → "Club Approval Letter"
- `10-event-approval-queue.md`'s approve flow → "Event Approval Letter"
- `11-funding-request-queue.md`'s approve flow → "Funding Approval Letter"

## Generation

- Use a simple HTML template per document type, rendered to PDF server-side (check current best-practice libraries for Next.js/Vercel — Puppeteer works but is heavy for serverless; look at lighter alternatives like `@react-pdf/renderer` or a hosted PDF API before assuming Puppeteer is the right call in this environment).
- Template content: institution name/logo (via Clerk's org image, already established), club name, the specific approval details (event date/location, or funding amount, or admin name — whichever is relevant), approval date, a simple official-looking layout. Keep it plain and professional — no need for elaborate design, per `ui-context.md`'s restrained tone.
- Store the generated PDF in Vercel Blob (same pattern as receipts/brainstorm snapshots), reference the URL from the relevant record (`ClubApplication`, `EventApprovalRequest`, or `FundingRequest` — add a `generatedDocumentUrl` field to each if not already present).

## UI

- On the union's approval-queue detail views (already built in `09`/`10`/`11`), show a "Download Approval Letter" link once generated.
- On the club's side, surface the same link wherever makes sense — e.g. the event detail dialog for an event approval letter, a small "Approval Letter" link near a funding request's status.

## Scope Limits

- don't build a general-purpose template editor — three fixed templates (club/event/funding) is the full scope for this spec
- don't add certificates, training completion docs, or any other document type — those are separate future ideas, not this spec
- don't make generation retryable/regenerable for now — generate once at approval time; if it fails, log the error but don't block the approval itself from succeeding

## Check When Done

- approving a club application, event, or funding request generates a real PDF, stored in Blob, linked from the relevant record
- the PDF contains accurate, real data (not placeholder text) for whichever type it is
- both the union side and the club side can access/download the generated letter
- a failure in PDF generation never blocks the underlying approval from completing
- `npm run build` passes