"use client"

import type { ReactNode } from "react"

import { AppDialog } from "@/components/app/app-dialog"
import { EVENT_STATUS_LABELS } from "@/components/events/board-types"
import type { BoardEvent } from "@/components/events/board-types"

interface EventDetailDialogProps {
  event: BoardEvent | null
  onOpenChange: (open: boolean) => void
}

// Bare read-only summary only — the full detail/checklist panel is
// 16-event-detail-checklist.md, out of scope here.
export function EventDetailDialog({ event, onOpenChange }: EventDetailDialogProps) {
  return (
    <AppDialog
      open={event !== null}
      onOpenChange={onOpenChange}
      title={event?.title ?? ""}
      description={EVENT_STATUS_LABELS[event?.status ?? "IDEA"]}
    >
      {event && (
        <div className="space-y-3 text-sm">
          {event.dateTime && (
            <Field label="Date">
              {new Date(event.dateTime).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Field>
          )}
          {event.location && <Field label="Location">{event.location}</Field>}
          {event.description && <Field label="Description">{event.description}</Field>}
          <p className="text-xs text-copy-muted">
            Full checklist and details coming soon.
          </p>
        </div>
      )}
    </AppDialog>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-copy-muted">{label}</p>
      <p className="mt-0.5 text-copy-primary">{children}</p>
    </div>
  )
}
