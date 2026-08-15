import type { BudgetEntryType } from "@/generated/prisma/client"

export type { BudgetEntryType }

export const BUDGET_ENTRY_TYPES: BudgetEntryType[] = ["INCOME", "EXPENSE"]

export const BUDGET_ENTRY_TYPE_LABELS: Record<BudgetEntryType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
}

export interface BudgetCategoryView {
  id: string
  name: string
  allocatedAmount: number
}

export interface BudgetEntryView {
  id: string
  amount: number
  type: BudgetEntryType
  note: string | null
  // ISO string — Prisma Decimal/Date don't cross the server/client boundary.
  date: string
  categoryId: string | null
  eventId: string | null
  receiptUrls: string[]
}

/** Minimal event shape for the entry form's "linked event" picker. */
export interface BudgetEventOption {
  id: string
  title: string
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}

/**
 * Entry dates are stored as UTC midnight (they come from a date-only input),
 * so they must be formatted in UTC too — formatting in local time shows the
 * previous day for anyone west of UTC.
 */
export function formatEntryDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/** Income adds, expense subtracts (17-budget-categories-entries.md). */
export function signedAmount(entry: BudgetEntryView): number {
  return entry.type === "INCOME" ? entry.amount : -entry.amount
}

export function sumEntries(entries: BudgetEntryView[]): number {
  return entries.reduce((total, entry) => total + signedAmount(entry), 0)
}

export function sumByType(entries: BudgetEntryView[], type: BudgetEntryType): number {
  return entries
    .filter((entry) => entry.type === type)
    .reduce((total, entry) => total + entry.amount, 0)
}
