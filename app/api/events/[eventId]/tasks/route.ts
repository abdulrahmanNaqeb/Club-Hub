import { NextResponse } from "next/server"

import { getActiveClub } from "@/lib/org-scope"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/events/[eventId]/tasks">
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

  const title =
    body && typeof body === "object" && "title" in body
      ? (body as { title: unknown }).title
      : null
  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "A task title is required." }, { status: 400 })
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event || event.clubId !== club.id) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 })
  }

  const task = await prisma.eventTask.create({
    data: { eventId, title: title.trim(), assignee: null, done: false },
  })

  return NextResponse.json({ task })
}
