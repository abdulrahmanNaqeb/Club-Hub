"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useMutation, useOthers, useStatus, useStorage } from "@liveblocks/react/suspense"
import type { EventStatus } from "@/generated/prisma/client"

import { EVENT_STATUSES } from "@/components/events/board-types"
import type { BoardEvent, ClubMember } from "@/components/events/board-types"
import { EventColumn } from "@/components/events/event-column"
import { EventCard } from "@/components/events/event-card"
import { EventDetailDialog } from "@/components/events/event-detail-dialog"

interface EventsBoardProps {
  initialEvents: BoardEvent[]
  members: ClubMember[]
}

export function EventsBoard({ initialEvents, members }: EventsBoardProps) {
  // Local copy so editing an event's core fields (16-event-detail-checklist.md)
  // can update the card in place — reconciliation/moveCard below still key
  // off `initialEvents` (event IDs/status never change from the detail
  // dialog), only the rendered content needs to reflect edits live.
  const [events, setEvents] = useState(initialEvents)

  const eventsById = useMemo(() => {
    const map = new Map<string, BoardEvent>()
    for (const event of events) map.set(event.id, event)
    return map
  }, [events])

  const columns = useStorage((root) => root.columns)
  const others = useOthers()
  const connectionStatus = useStatus()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<BoardEvent | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reconciliation must run exactly once per room connection, not on every
  // render/storage update — see 14-events-board.md's "Reconciliation on room
  // load" note.
  const hasReconciled = useRef(false)

  const reconcile = useMutation(
    ({ storage }) => {
      const columnsObj = storage.get("columns")
      const seen = new Set<string>()
      for (const s of EVENT_STATUSES) {
        for (const id of columnsObj.get(s)) seen.add(id)
      }
      for (const event of initialEvents) {
        if (!seen.has(event.id)) {
          columnsObj.get(event.status).push(event.id)
          seen.add(event.id)
        }
      }
    },
    [initialEvents]
  )

  useEffect(() => {
    if (hasReconciled.current) return
    hasReconciled.current = true
    reconcile()
  }, [reconcile])

  const moveCard = useMutation(
    ({ storage }, params: { eventId: string; toStatus: EventStatus; toIndex: number }) => {
      const columnsObj = storage.get("columns")

      for (const s of EVENT_STATUSES) {
        const list = columnsObj.get(s)
        const idx = list.indexOf(params.eventId)
        if (idx !== -1) list.delete(idx)
      }

      const destList = columnsObj.get(params.toStatus)
      destList.insert(params.eventId, Math.min(params.toIndex, destList.length))
    },
    []
  )

  const reorderInColumn = useMutation(
    ({ storage }, params: { status: EventStatus; fromIndex: number; toIndex: number }) => {
      storage.get("columns").get(params.status).move(params.fromIndex, params.toIndex)
    },
    []
  )

  const columnEvents = useMemo(() => {
    const result: Record<EventStatus, BoardEvent[]> = {
      IDEA: [],
      PLANNING: [],
      CONFIRMED: [],
      DONE: [],
    }
    for (const s of EVENT_STATUSES) {
      for (const id of columns[s]) {
        const event = eventsById.get(id)
        if (event) result[s].push(event)
      }
    }
    return result
  }, [columns, eventsById])

  const findColumnOf = useCallback(
    (id: string): EventStatus | null => {
      for (const s of EVENT_STATUSES) {
        if (columns[s].includes(id)) return s
      }
      return null
    },
    [columns]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart(dragEvent: DragStartEvent) {
    setActiveId(String(dragEvent.active.id))
  }

  async function handleDragEnd(dragEvent: DragEndEvent) {
    setActiveId(null)
    const { active, over } = dragEvent
    if (!over) return

    const eventId = String(active.id)
    const fromStatus = findColumnOf(eventId)
    if (!fromStatus) return

    const overId = String(over.id)
    const overIsColumn = (EVENT_STATUSES as string[]).includes(overId)
    const toStatus = overIsColumn ? (overId as EventStatus) : findColumnOf(overId)
    if (!toStatus) return

    const fromIndex = columns[fromStatus].indexOf(eventId)
    const toIndex = overIsColumn
      ? columns[toStatus].length
      : (() => {
          const idx = columns[toStatus].indexOf(overId)
          return idx === -1 ? columns[toStatus].length : idx
        })()

    if (fromStatus === toStatus) {
      if (fromIndex !== toIndex) {
        reorderInColumn({ status: fromStatus, fromIndex, toIndex })
      }
      return
    }

    // Optimistic Storage update first (instant UI feedback), then the
    // Prisma write — revert Storage if the write fails so the UI never
    // shows a column the database doesn't actually agree with.
    moveCard({ eventId, toStatus, toIndex })
    // Optimistically reflect the status change in local state so the
    // EventDetailDialog and cards render the moved status immediately.
    setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status: toStatus } : ev)))
    setError(null)

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      })
      if (!res.ok) throw new Error("Request failed")
    } catch {
      moveCard({ eventId, toStatus: fromStatus, toIndex: fromIndex })
      // Restore the previous local status alongside Storage rollback.
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status: fromStatus } : ev)))
      setError("Couldn't move that card. Please try again.")
    }
  }

  const activeEvent = activeId ? eventsById.get(activeId) ?? null : null

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-copy-secondary">
          {others.length + 1} {others.length === 0 ? "person" : "people"} viewing
        </p>
        {connectionStatus !== "connected" && (
          <p className="text-xs text-warning">
            {connectionStatus === "connecting" || connectionStatus === "reconnecting"
              ? "Reconnecting…"
              : "Connection lost — changes may not sync until it's restored."}
          </p>
        )}
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <DndContext
        id="events-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
          {EVENT_STATUSES.map((s) => (
            <EventColumn key={s} status={s} events={columnEvents[s]} onOpenEvent={setSelectedEvent} />
          ))}
        </div>

        <DragOverlay>
          {activeEvent && <EventCard event={activeEvent} onOpen={() => {}} />}
        </DragOverlay>
      </DndContext>

      <EventDetailDialog
        event={selectedEvent}
        members={members}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null)
        }}
        onEventUpdated={(updated) => {
          setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
          setSelectedEvent(updated)
        }}
      />
    </div>
  )
}
