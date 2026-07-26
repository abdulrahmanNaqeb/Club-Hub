"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EventDetailDialog } from "@/components/events/event-detail-dialog"
import type { BoardEvent } from "@/components/events/board-types"

interface EventsCalendarProps {
  events: BoardEvent[]
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MAX_VISIBLE_PER_DAY = 3
const WEEKS_IN_GRID = 6

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// Building a fixed 6-week grid off `new Date`'s own overflow handling
// (e.g. day 0 of a month rolls back into the previous one) is what makes
// month boundaries — including December -> January -- work for free.
function buildMonthGrid(monthStart: Date) {
  const year = monthStart.getFullYear()
  const month = monthStart.getMonth()
  const startOffset = new Date(year, month, 1).getDay()
  const gridStart = new Date(year, month, 1 - startOffset)

  const days: { date: Date; inCurrentMonth: boolean }[] = []
  for (let i = 0; i < WEEKS_IN_GRID * 7; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    days.push({ date, inCurrentMonth: date.getMonth() === month })
  }
  return days
}

export function EventsCalendar({ events }: EventsCalendarProps) {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedEvent, setSelectedEvent] = useState<BoardEvent | null>(null)

  const unscheduled = useMemo(() => events.filter((event) => event.dateTime === null), [events])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, BoardEvent[]>()
    for (const event of events) {
      if (event.dateTime === null) continue
      const key = dateKey(new Date(event.dateTime))
      const list = map.get(key)
      if (list) list.push(event)
      else map.set(key, [event])
    }
    return map
  }, [events])

  const days = useMemo(() => buildMonthGrid(cursor), [cursor])
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
  const todayKey = dateKey(today)

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 rounded-2xl border border-surface-border bg-surface p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-copy-primary">{monthLabel}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous month"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next month"
              onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-surface-border">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="bg-subtle px-2 py-1.5 text-center text-xs font-medium uppercase tracking-wide text-copy-muted"
            >
              {label}
            </div>
          ))}
          {days.map(({ date, inCurrentMonth }) => {
            const key = dateKey(date)
            const dayEvents = eventsByDay.get(key) ?? []
            const visible = dayEvents.slice(0, MAX_VISIBLE_PER_DAY)
            const overflow = dayEvents.length - visible.length

            return (
              <div key={key} className={cn("min-h-24 bg-elevated p-1.5", !inCurrentMonth && "bg-surface")}>
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    inCurrentMonth ? "text-copy-secondary" : "text-copy-faint",
                    key === todayKey && "bg-primary font-semibold text-primary-foreground"
                  )}
                >
                  {date.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {visible.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="block w-full truncate rounded-md bg-accent-dim px-1.5 py-0.5 text-left text-xs text-copy-primary hover:bg-surface-border-subtle"
                    >
                      {event.title}
                    </button>
                  ))}
                  {overflow > 0 && <p className="px-1.5 text-xs text-copy-muted">+{overflow} more</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="w-full shrink-0 rounded-2xl border border-surface-border bg-surface p-4 lg:w-72">
        <h3 className="text-sm font-semibold text-copy-primary">Unscheduled</h3>
        <p className="mt-1 text-xs text-copy-muted">Ideas without a date yet.</p>
        <div className="mt-3 space-y-2">
          {unscheduled.length === 0 && <p className="text-xs text-copy-faint">Nothing unscheduled.</p>}
          {unscheduled.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedEvent(event)}
              className="block w-full rounded-xl border border-transparent bg-elevated px-3 py-2 text-left text-sm text-copy-primary hover:border-surface-border"
            >
              {event.title}
            </button>
          ))}
        </div>
      </div>

      <EventDetailDialog
        event={selectedEvent}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null)
        }}
      />
    </div>
  )
}
