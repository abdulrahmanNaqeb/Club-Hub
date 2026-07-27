import type { BudgetCategory, BudgetEntry } from "@/generated/prisma/client"
import type { BudgetCategoryView, BudgetEntryView } from "@/components/budget/budget-types"

// Prisma Decimal and Date instances don't serialize across the server/client
// boundary — every budget row crosses it through one of these two functions
// so the conversion can't drift between the page and the API routes.

export function serializeCategory(category: BudgetCategory): BudgetCategoryView {
  return {
    id: category.id,
    name: category.name,
    allocatedAmount: Number(category.allocatedAmount),
  }
}

export function serializeEntry(entry: BudgetEntry): BudgetEntryView {
  return {
    id: entry.id,
    amount: Number(entry.amount),
    type: entry.type,
    note: entry.note,
    date: entry.date.toISOString(),
    categoryId: entry.categoryId,
    eventId: entry.eventId,
    receiptUrls: entry.receiptUrls,
  }
}
