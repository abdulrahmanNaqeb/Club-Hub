import { NextResponse } from "next/server"

import { getActiveClub } from "@/lib/org-scope"
import { prisma } from "@/lib/prisma"
import { validateEntryLinks } from "@/lib/budget-links"
import { serializeEntry } from "@/lib/budget-serialize"
import { BudgetEntryType } from "@/generated/prisma/client"

const VALID_TYPES = new Set<string>(Object.values(BudgetEntryType))

interface EntryCreateInput {
  amount: number
  type: BudgetEntryType
  date: Date
  note: string | null
  categoryId: string | null
  eventId: string | null
}

function parseEntryCreateBody(body: unknown): EntryCreateInput | null {
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>

  const amount = Number(b.amount)
  if (!Number.isFinite(amount) || amount <= 0) return null

  if (typeof b.type !== "string" || !VALID_TYPES.has(b.type)) return null

  if (typeof b.date !== "string") return null
  const date = new Date(b.date)
  if (Number.isNaN(date.getTime())) return null

  if (b.note != null && typeof b.note !== "string") return null
  if (b.categoryId != null && typeof b.categoryId !== "string") return null
  if (b.eventId != null && typeof b.eventId !== "string") return null

  const note = typeof b.note === "string" ? b.note.trim() : ""

  return {
    amount,
    type: b.type as BudgetEntryType,
    date,
    note: note.length > 0 ? note : null,
    categoryId: (b.categoryId as string | null | undefined) ?? null,
    eventId: (b.eventId as string | null | undefined) ?? null,
  }
}

export async function GET() {
  let club
  try {
    club = await getActiveClub()
  } catch {
    return NextResponse.json({ error: "Not authorized for this club." }, { status: 403 })
  }

  const entries = await prisma.budgetEntry.findMany({
    where: { clubId: club.id },
    orderBy: { date: "desc" },
  })

  return NextResponse.json({ entries: entries.map(serializeEntry) })
}

export async function POST(request: Request) {
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

  const data = parseEntryCreateBody(body)
  if (!data) {
    return NextResponse.json(
      { error: "An amount greater than zero, a type, and a date are required." },
      { status: 400 }
    )
  }

  const linkError = await validateEntryLinks(club.id, data.categoryId, data.eventId)
  if (linkError) {
    return NextResponse.json({ error: linkError }, { status: 404 })
  }

  const entry = await prisma.budgetEntry.create({
    data: {
      clubId: club.id,
      amount: data.amount,
      type: data.type,
      date: data.date,
      note: data.note,
      categoryId: data.categoryId,
      eventId: data.eventId,
    },
  })

  return NextResponse.json({ entry: serializeEntry(entry) }, { status: 201 })
}
