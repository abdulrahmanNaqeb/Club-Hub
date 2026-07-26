"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"
import type { BoardEvent } from "@/components/events/board-types"

interface EventCardProps {
  event: BoardEvent
  onOpen: (event: BoardEvent) => void
}

export function EventCard({ event, onOpen }: EventCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dateLabel = event.dateTime
    ? new Date(event.dateTime).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null

  // No accent-primary "assigned to me" stripe: Event has no creator/assignee
  // column yet (that arrives with checklists in 16-event-detail-checklist.md),
  // and 14-events-board.md explicitly allows skipping this until then.
  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={() => onOpen(event)}
      {...attributes}
      {...listeners}
      className={cn(
        "w-full rounded-xl border border-transparent bg-elevated p-3 text-left shadow-sm transition-shadow",
        "hover:border-surface-border",
        isDragging && "border-surface-border-subtle opacity-60 shadow-md"
      )}
    >
      <p className="text-sm font-medium text-copy-primary">{event.title}</p>
      {dateLabel && <p className="mt-1 text-xs text-copy-secondary">{dateLabel}</p>}
    </button>
  )
}
