import { requireOrgMode } from "@/lib/get-org-mode"
import { prisma } from "@/lib/prisma"
import { serializeCategory, serializeEntry } from "@/lib/budget-serialize"
import { AppShell } from "@/components/app/app-shell"
import { BudgetView } from "@/components/budget/budget-view"
import type { BudgetEventOption } from "@/components/budget/budget-types"

export default async function BudgetPage() {
  const club = await requireOrgMode("club")

  const [categories, entries, events] = await Promise.all([
    prisma.budgetCategory.findMany({
      where: { clubId: club.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.budgetEntry.findMany({
      where: { clubId: club.id },
      orderBy: { date: "desc" },
    }),
    prisma.event.findMany({
      where: { clubId: club.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true },
    }),
  ])

  const eventOptions: BudgetEventOption[] = events.map((event) => ({
    id: event.id,
    title: event.title,
  }))

  return (
    <AppShell mode="club" title="Budget">
      <BudgetView
        availableBudget={Number(club.baselineBudgetAmount)}
        initialCategories={categories.map(serializeCategory)}
        initialEntries={entries.map(serializeEntry)}
        events={eventOptions}
      />
    </AppShell>
  )
}
