import { NextResponse } from "next/server"

import { getActiveClub } from "@/lib/org-scope"
import { prisma } from "@/lib/prisma"
import { serializeCategory } from "@/lib/budget-serialize"

interface CategoryCreateInput {
  name: string
  allocatedAmount: number
}

function parseCategoryCreateBody(body: unknown): CategoryCreateInput | null {
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>

  if (typeof b.name !== "string" || b.name.trim().length === 0) return null

  const allocatedAmount = Number(b.allocatedAmount)
  if (!Number.isFinite(allocatedAmount) || allocatedAmount < 0) return null

  return { name: b.name.trim(), allocatedAmount }
}

export async function GET() {
  let club
  try {
    club = await getActiveClub()
  } catch {
    return NextResponse.json({ error: "Not authorized for this club." }, { status: 403 })
  }

  const categories = await prisma.budgetCategory.findMany({
    where: { clubId: club.id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ categories: categories.map(serializeCategory) })
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

  const data = parseCategoryCreateBody(body)
  if (!data) {
    return NextResponse.json(
      { error: "A name and a non-negative allocated amount are required." },
      { status: 400 }
    )
  }

  const category = await prisma.budgetCategory.create({
    data: { clubId: club.id, name: data.name, allocatedAmount: data.allocatedAmount },
  })

  return NextResponse.json({ category: serializeCategory(category) }, { status: 201 })
}
