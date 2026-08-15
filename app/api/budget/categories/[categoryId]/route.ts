import { NextResponse } from "next/server"

import { getActiveClub } from "@/lib/org-scope"
import { prisma } from "@/lib/prisma"
import { serializeCategory } from "@/lib/budget-serialize"
import type { Prisma } from "@/generated/prisma/client"

function parseCategoryPatchBody(body: unknown): Prisma.BudgetCategoryUpdateInput | null {
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>
  const data: Prisma.BudgetCategoryUpdateInput = {}
  let hasField = false

  if ("name" in b) {
    if (typeof b.name !== "string" || b.name.trim().length === 0) return null
    data.name = b.name.trim()
    hasField = true
  }

  if ("allocatedAmount" in b) {
    const allocatedAmount = Number(b.allocatedAmount)
    if (!Number.isFinite(allocatedAmount) || allocatedAmount < 0) return null
    data.allocatedAmount = allocatedAmount
    hasField = true
  }

  return hasField ? data : null
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/budget/categories/[categoryId]">
) {
  const { categoryId } = await ctx.params

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

  const data = parseCategoryPatchBody(body)
  if (!data) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 })
  }

  const category = await prisma.budgetCategory.findUnique({ where: { id: categoryId } })
  if (!category || category.clubId !== club.id) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 })
  }

  const updated = await prisma.budgetCategory.update({ where: { id: categoryId }, data })

  return NextResponse.json({ category: serializeCategory(updated) })
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/budget/categories/[categoryId]">
) {
  const { categoryId } = await ctx.params

  let club
  try {
    club = await getActiveClub()
  } catch {
    return NextResponse.json({ error: "Not authorized for this club." }, { status: 403 })
  }

  const category = await prisma.budgetCategory.findUnique({ where: { id: categoryId } })
  if (!category || category.clubId !== club.id) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 })
  }

  // BudgetEntry.categoryId is onDelete: SetNull, so the category's entries
  // survive as uncategorized rather than being deleted with it.
  await prisma.budgetCategory.delete({ where: { id: categoryId } })

  return NextResponse.json({ ok: true })
}
