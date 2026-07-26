import type { EventStatus } from "@/generated/prisma/client"

export const EVENT_STATUSES: EventStatus[] = ["IDEA", "PLANNING", "CONFIRMED", "DONE"]

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  IDEA: "Idea",
  PLANNING: "Planning",
  CONFIRMED: "Confirmed",
  DONE: "Done",
}

export interface BoardEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  status: EventStatus
  dateTime: string | null
}
