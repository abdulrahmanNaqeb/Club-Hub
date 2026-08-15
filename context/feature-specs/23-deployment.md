Two things this session.

## Part 1: Bug fix — brainstorm ranked list crashes on undefined voterIds

/brainstorm throws "Cannot read properties of undefined (reading 'includes')" at lib/brainstorm-serialize.ts:13 (idea.voterIds.includes(userId)). Root cause: some BrainstormIdea rows predate the voterIds field being added and have it as null/undefined rather than an empty array.

Fix both the data and the code defensively:
- Backfill any existing BrainstormIdea rows where voterIds is null to an empty array.
- Make voterIds non-nullable with a default empty array at the schema level if it isn't already (check 05-prisma.md's model — this may already say it should default to empty array; if the column itself allows null, that's the actual bug to fix).
- In lib/brainstorm-serialize.ts, guard defensively anyway (idea.voterIds ?? []) so a future row in this same bad state can't crash the page again — belt and suspenders, not just the migration fix.

Verify by reloading /brainstorm with real data and confirming no error, including any club with ideas created before this fix.

## Part 2: 23-deployment.md
Deploy ClubOS to production — a real, publicly reachable URL, with every service (Clerk, Liveblocks, Trigger.dev, Vercel Blob, Resend, Prisma Postgres) pointed at production credentials instead of development ones. This is the last spec in the plan.

## Before Starting — one real decision needed from the human, not the agent

You need a **domain you own** — Clerk's production instance cannot use a `*.vercel.app` domain; it requires DNS records on a real domain. If you don't have one yet, buy one (any registrar) before starting this spec. Confirm the domain with the human before proceeding; don't guess or use a placeholder.

## Host: Vercel

Connect the GitHub repo to a new Vercel project (or the existing one if `club-hub-receipts`'s Blob store was already connected to one). Vercel auto-detects Next.js — no custom build config needed for a standard setup.

## Database

Decide (and confirm with the human, don't assume): does production use the **same** Prisma Postgres database as development, or a **separate** one? Given this project has accumulated a fair amount of test/junk data (orphaned Club rows, duplicate test orgs, etc. — see `progress-tracker.md`'s open questions), a **fresh, separate production database** is almost certainly the right call. If so: create a new Prisma Postgres database (same process as the original dev one), run migrations against it fresh (`prisma migrate deploy`, not `migrate dev`), and do not carry over any dev test data.

## Clerk — production instance

Per Clerk's current docs, this is a real multi-step process, not just swapping an env var:
1. In the Clerk Dashboard, create a **production instance** (clone development settings — recommended, keeps your Organizations config, roles, etc.).
2. Add your real domain, get the DNS records (CNAME entries) Clerk provides, add them at your domain registrar. This can take time to propagate (up to 48 hours per Clerk's docs) — don't block the rest of deployment on this, but don't consider Clerk done until it verifies.
3. Copy the production API keys (`pk_live_...` / `sk_live_...`) into Vercel's environment variables for the Production environment specifically (Vercel scopes env vars per environment — Production/Preview/Development are separate).
4. Note: SSO/OAuth connections and webhook endpoints do NOT carry over automatically from dev to production per Clerk's docs — if you're using any, they need to be reconfigured against the production instance.

## Liveblocks, Trigger.dev, Resend — production keys

- **Liveblocks**: check whether your existing project has a separate Production environment/key in its dashboard (most Liveblocks projects do — dev and production keys are usually distinct). Add the production secret key to Vercel's Production env vars.
- **Trigger.dev**: run `npx trigger.dev@latest deploy` to actually deploy your tasks (this is a distinct step from `npx trigger.dev@latest dev` — deploying compiles and registers your tasks for real production runs, they don't run in production just because they work locally). Copy the production API key from the Trigger.dev dashboard into `TRIGGER_SECRET_KEY` in Vercel's Production env vars.
- **Resend**: check whether your API key is already usable in production or if Resend has a separate production/verified-domain requirement (sending from a verified domain, not a sandbox address) — check their current dashboard, don't assume.

## Vercel Blob

Decide whether production uses the same `club-hub-receipts` store or a fresh one — given it's currently empty of real user data, reusing it is reasonable, but confirm with the human rather than assuming.

## Environment Variable Checklist

Go through every `.env`/`.env.local` variable used anywhere in the app and confirm each has a Production-scoped equivalent set in Vercel: `DATABASE_URL`, Clerk keys, `LIVEBLOCKS_SECRET_KEY`, `TRIGGER_SECRET_KEY`, `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, and any others accumulated across specs `00` through `22`. Missing one will cause a production crash on first use of that feature, not a build failure — so this needs to be a deliberate checklist, not a guess.

## Final Smoke Test

Once deployed and all DNS/keys verified: on the real production URL, walk through the actual core loop end to end — sign up, submit a club application, approve it as a union, land in a real club workspace, create an event, drag it on the board, add a budget entry. This is the final proof the whole thing works, not just that it built successfully.

## Scope Limits

- don't set up a custom CI/CD pipeline beyond Vercel's default GitHub integration — that's already automatic (push to main → deploy)
- don't set up staging/preview-specific infrastructure beyond what Vercel does automatically for PR previews
- don't optimize performance/caching as part of this spec — get it working correctly first

## Check When Done

- the app is reachable at the real domain, not a `*.vercel.app` URL
- Clerk's production instance shows fully verified (DNS + SSL) in its dashboard
- every environment variable checklist item is confirmed present in Vercel's Production scope
- Trigger.dev tasks are confirmed deployed (not just working in local dev)
- the full smoke test (signup → application → approval → club workspace → event → budget) works on the real production
