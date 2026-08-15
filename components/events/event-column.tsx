"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import type { EventStatus } from "@/generated/prisma/client"

import { cn } from "@/lib/utils"
import { EVENT_STATUS_LABELS } from "@/components/events/board-types"
import { EventCard } from "@/components/events/event-card"
import type { BoardEvent } from "@/components/events/board-types"

interface EventColumnProps {
  status: EventStatus
  events: BoardEvent[]
  onOpenEvent: (event: BoardEvent) => void
}

export function EventColumn({ status, events, onOpenEvent }: EventColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-surface-border bg-surface">
      <div className="flex items-center justify-between px-3 py-3">
        <h3 className="text-sm font-semibold text-copy-primary">
          {EVENT_STATUS_LABELS[status]}
        </h3>
        <span className="text-xs text-copy-muted">{events.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-b-2xl p-3 pt-0 transition-colors",
          isOver && "bg-accent-dim"
        )}
      >
        <SortableContext items={events.map((event) => event.id)} strategy={verticalListSortingStrategy}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} onOpen={onOpenEvent} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
