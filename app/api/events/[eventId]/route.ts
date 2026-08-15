import { NextResponse } from "next/server"

import { getActiveClub } from "@/lib/org-scope"
import { prisma } from "@/lib/prisma"
import { EventStatus, type Prisma } from "@/generated/prisma/client"

const VALID_STATUSES = new Set<string>(Object.values(EventStatus))

function parseEventPatchBody(body: unknown): Prisma.EventUpdateInput | null {
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>
  const data: Prisma.EventUpdateInput = {}
  let hasField = false

  if ("status" in b) {
    if (typeof b.status !== "string" || !VALID_STATUSES.has(b.status)) return null
    data.status = b.status as EventStatus
    hasField = true
  }

  if ("title" in b) {
    if (typeof b.title !== "string" || b.title.trim().length === 0) return null
    data.title = b.title.trim()
    hasField = true
  }

  if ("description" in b) {
    if (b.description !== null && typeof b.description !== "string") return null
    data.description = b.description
    hasField = true
  }

  if ("location" in b) {
    if (b.location !== null && typeof b.location !== "string") return null
    data.location = b.location
    hasField = true
  }

  if ("dateTime" in b) {
    if (b.dateTime === null) {
      data.dateTime = null
      hasField = true
    } else if (typeof b.dateTime === "string") {
      const parsed = new Date(b.dateTime)
      if (Number.isNaN(parsed.getTime())) return null
      data.dateTime = parsed
      hasField = true
    } else {
      return null
    }
  }

  return hasField ? data : null
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/events/[eventId]">
) {
  const { eventId } = await ctx.params

  let club
  try {
    club = await getActiveClub()
  } catch {
    return NextResponse.json({ error: "Not authorized for this club." }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const data = parseEventPatchBody(body)
  if (!data) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 })
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event || event.clubId !== club.id) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 })
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data,
  })

  return NextResponse.json({
    event: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      location: updated.location,
      status: updated.status,
      dateTime: updated.dateTime ? updated.dateTime.toISOString() : null,
    },
  })
}
