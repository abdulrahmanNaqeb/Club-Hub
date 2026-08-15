import { NextResponse } from "next/server"
import { del } from "@vercel/blob"

import { getActiveClub } from "@/lib/org-scope"
import { prisma } from "@/lib/prisma"
import { validateEntryLinks } from "@/lib/budget-links"
import { serializeEntry } from "@/lib/budget-serialize"
import { BudgetEntryType, type Prisma } from "@/generated/prisma/client"

const VALID_TYPES = new Set<string>(Object.values(BudgetEntryType))

interface ParsedEntryPatch {
  data: Prisma.BudgetEntryUpdateInput
  categoryId?: string | null
  eventId?: string | null
}

function parseEntryPatchBody(body: unknown): ParsedEntryPatch | null {
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>
  const data: Prisma.BudgetEntryUpdateInput = {}
  const parsed: ParsedEntryPatch = { data }
  let hasField = false

  if ("amount" in b) {
    const amount = Number(b.amount)
    if (!Number.isFinite(amount) || amount <= 0) return null
    data.amount = amount
    hasField = true
  }

  if ("type" in b) {
    if (typeof b.type !== "string" || !VALID_TYPES.has(b.type)) return null
    data.type = b.type as BudgetEntryType
    hasField = true
  }

  if ("date" in b) {
    if (typeof b.date !== "string") return null
    const date = new Date(b.date)
    if (Number.isNaN(date.getTime())) return null
    data.date = date
    hasField = true
  }

  if ("note" in b) {
    if (b.note !== null && typeof b.note !== "string") return null
    const note = typeof b.note === "string" ? b.note.trim() : ""
    data.note = note.length > 0 ? note : null
    hasField = true
  }

  if ("categoryId" in b) {
    if (b.categoryId !== null && typeof b.categoryId !== "string") return null
    parsed.categoryId = b.categoryId
    data.category = b.categoryId
      ? { connect: { id: b.categoryId } }
      : { disconnect: true }
    hasField = true
  }

  if ("eventId" in b) {
    if (b.eventId !== null && typeof b.eventId !== "string") return null
    parsed.eventId = b.eventId
    data.event = b.eventId ? { connect: { id: b.eventId } } : { disconnect: true }
    hasField = true
  }

  return hasField ? parsed : null
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/budget/entries/[entryId]">
) {
  const { entryId } = await ctx.params

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

  const parsed = parseEntryPatchBody(body)
  if (!parsed) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 })
  }

  const entry = await prisma.budgetEntry.findUnique({ where: { id: entryId } })
  if (!entry || entry.clubId !== club.id) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 })
  }

  const linkError = await validateEntryLinks(club.id, parsed.categoryId, parsed.eventId)
  if (linkError) {
    return NextResponse.json({ error: linkError }, { status: 404 })
  }

  const updated = await prisma.budgetEntry.update({
    where: { id: entryId },
    data: parsed.data,
  })

  return NextResponse.json({ entry: serializeEntry(updated) })
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/budget/entries/[entryId]">
) {
  const { entryId } = await ctx.params

  let club
  try {
    club = await getActiveClub()
  } catch {
    return NextResponse.json({ error: "Not authorized for this club." }, { status: 403 })
  }

  const entry = await prisma.budgetEntry.findUnique({ where: { id: entryId } })
  if (!entry || entry.clubId !== club.id) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 })
  }

  await prisma.budgetEntry.delete({ where: { id: entryId } })

  // Best-effort blob cleanup so deleted entries don't orphan their receipts —
  // same "log it, don't fail the request" cleanup pattern the club-application
  // approve route uses for its Clerk org rollback.
  if (entry.receiptUrls.length > 0) {
    try {
      await del(entry.receiptUrls)
    } catch (error) {
      console.warn(`Failed to delete receipt blobs for entry ${entryId}:`, error)
    }
  }

  return NextResponse.json({ ok: true })
}
