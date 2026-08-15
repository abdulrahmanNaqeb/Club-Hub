import type { EventStatus } from "@/generated/prisma/client"

export const EVENT_STATUSES: EventStatus[] = ["IDEA", "PLANNING", "CONFIRMED", "DONE"]

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  IDEA: "Idea",
  PLANNING: "Planning",
  CONFIRMED: "Confirmed",
  DONE: "Done",
}

export interface EventTask {
  id: string
  title: string
  assignee: string | null
  done: boolean
}

export interface ClubMember {
  id: string
  name: string
}

export interface BoardEvent {
  id: string
  title: string
  description: string | null
  location: string | null
  status: EventStatus
  dateTime: string | null
  tasks: EventTask[]
  // Computed once, server-side, from the initial fetch — does not live-update
  // if a task is reassigned to/from the current user within the same
  // session (see 16-event-detail-checklist.md's "only if cheap" scope note).
  assignedToMe: boolean
}
