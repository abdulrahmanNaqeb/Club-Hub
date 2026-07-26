import { NextResponse } from "next/server"

import { getActiveClub } from "@/lib/org-scope"
import { prisma } from "@/lib/prisma"
import { EventStatus } from "@/generated/prisma/client"

const VALID_STATUSES = new Set<string>(Object.values(EventStatus))

function parseStatus(body: unknown): EventStatus | null {
  if (!body || typeof body !== "object" || !("status" in body)) return null
  const { status } = body as { status: unknown }
  if (typeof status !== "string" || !VALID_STATUSES.has(status)) return null
  return status as EventStatus
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

  const status = parseStatus(body)
  if (!status) {
    return NextResponse.json({ error: "A valid event status is required." }, { status: 400 })
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event || event.clubId !== club.id) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 })
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status },
  })

  return NextResponse.json({ event: { id: updated.id, status: updated.status } })
}
