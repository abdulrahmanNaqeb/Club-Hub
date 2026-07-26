import { NextResponse } from "next/server"

import { getActiveClub } from "@/lib/org-scope"
import { prisma } from "@/lib/prisma"

async function loadOwnedTask(eventId: string, taskId: string, clubId: string) {
  const task = await prisma.eventTask.findUnique({
    where: { id: taskId },
    include: { event: true },
  })
  if (!task || task.eventId !== eventId || task.event.clubId !== clubId) return null
  return task
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/events/[eventId]/tasks/[taskId]">
) {
  const { eventId, taskId } = await ctx.params

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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }
  const b = body as Record<string, unknown>
  const data: { title?: string; done?: boolean; assignee?: string | null } = {}

  if ("title" in b) {
    if (typeof b.title !== "string" || b.title.trim().length === 0) {
      return NextResponse.json({ error: "Task title cannot be empty." }, { status: 400 })
    }
    data.title = b.title.trim()
  }

  if ("done" in b) {
    if (typeof b.done !== "boolean") {
      return NextResponse.json({ error: "done must be a boolean." }, { status: 400 })
    }
    data.done = b.done
  }

  if ("assignee" in b) {
    if (b.assignee !== null && typeof b.assignee !== "string") {
      return NextResponse.json({ error: "assignee must be a string or null." }, { status: 400 })
    }
    data.assignee = b.assignee
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 })
  }

  const existing = await loadOwnedTask(eventId, taskId, club.id)
  if (!existing) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 })
  }

  const updated = await prisma.eventTask.update({ where: { id: taskId }, data })

  return NextResponse.json({
    task: { id: updated.id, title: updated.title, assignee: updated.assignee, done: updated.done },
  })
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/events/[eventId]/tasks/[taskId]">
) {
  const { eventId, taskId } = await ctx.params

  let club
  try {
    club = await getActiveClub()
  } catch {
    return NextResponse.json({ error: "Not authorized for this club." }, { status: 403 })
  }

  const existing = await loadOwnedTask(eventId, taskId, club.id)
  if (!existing) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 })
  }

  await prisma.eventTask.delete({ where: { id: taskId } })

  return NextResponse.json({ ok: true })
}
