Build the two background jobs `architecture-context.md` planned for Trigger.dev: per-event reminder emails (day-before, hour-before) and a weekly digest email per club. This is meaningfully different from `12`'s job — that one was a simple recurring cron; reminders here are dynamic, scheduled relative to each event's own date/time, and need to be rescheduled or cancelled if that date changes.

## Email Provider Setup

No email-sending account exists yet. Set up Resend (the simplest, most common pairing with Next.js/Vercel apps) — but check Resend's *current* docs before writing integration code rather than assuming a specific SDK shape from training data, since this is exactly the kind of thing that changes between versions. Add whatever API key it requires to `.env` (flag the exact variable name expected once you've checked). If you have a strong reason to prefer a different provider (Postmark, etc.), say so and justify it — otherwise default to Resend.

## Event Reminders — dynamic per-event scheduling

Unlike `12`'s fixed daily cron, this needs Trigger.dev's support for scheduling an arbitrary one-off future run at a specific timestamp (not a recurring pattern) — check Trigger.dev's current docs for the correct current API to do this, don't assume it's the same shape as `12`'s scheduled task.

- When an event is approved (`10-event-approval-queue.md`'s flow) or has its `dateTime` set/edited (`16-event-detail-checklist.md`'s editable fields), schedule two reminder runs: 24 hours before `dateTime`, and 1 hour before — only if that time is still in the future (don't schedule a reminder for a time that's already passed).
- If an event's `dateTime` changes after reminders were already scheduled, the old scheduled runs must be cancelled and new ones scheduled — don't let stale reminders fire for an old time. Use a deterministic identifier (e.g. derived from `eventId` + reminder type) so you can find and cancel the right prior run rather than accumulating duplicates.
- If `dateTime` is cleared (event goes back to having no date), cancel any pending reminders for it.
- Reminder content: simple — event title, date/time, location, a link back to the app. Sent to every member of the club (resolve via the same Clerk-membership pattern used everywhere since `16`'s `lib/club-members.ts`).

## Weekly Digest

- A recurring scheduled task (same simple-cron pattern as `12`'s `check-overspend`) — once a week, per club.
- Content: upcoming events in the next 7 days, current budget summary (available budget, net total — same numbers already shown on `/budget`).
- Sent to all club members, same resolution pattern as reminders.

## Where Scheduling Gets Triggered

Add the schedule/cancel calls into the existing event-approval (`10`) and event-detail-edit (`16`) code paths — don't build a separate polling job that scans for events needing reminders; trigger it directly at the moment an event's date is actually set or changed.

## Scope Limits

- don't build user-configurable notification preferences (opt out, change timing) — everyone gets reminders/digests, no settings UI, for now
- don't add SMS or any channel besides email
- don't build a "notification history/log" view — if it sends, it sends, no UI to review past sends
- don't touch the overspend-flagging job from `12` — this is additive, separate jobs

## Check When Done

- approving an event with a future date schedules both reminders correctly
- editing an event's date reschedules reminders correctly (old ones don't still fire)
- clearing an event's date cancels pending reminders
- the weekly digest job runs on schedule and includes real upcoming events + real budget numbers for that club
- a real test email (reminder or digest) is confirmed actually delivered — not just logged as "would have sent," an actual received email
- `npm run build` passes