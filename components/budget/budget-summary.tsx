import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatMoney, sumByType, sumEntries } from "@/components/budget/budget-types"
import type { BudgetEntryView } from "@/components/budget/budget-types"

interface BudgetSummaryProps {
  /** Club.baselineBudgetAmount — the cumulative union-approved budget. */
  availableBudget: number
  entries: BudgetEntryView[]
}

interface FigureProps {
  label: string
  value: number
  hint?: string
  tone?: "default" | "income" | "expense" | "auto"
}

function Figure({ label, value, hint, tone = "default" }: FigureProps) {
  const toneClass =
    tone === "income"
      ? "text-success"
      : tone === "expense"
        ? "text-error"
        : tone === "auto" && value < 0
          ? "text-error"
          : "text-copy-primary"

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium tracking-wide text-copy-muted uppercase">
        {label}
      </span>
      <span className={cn("font-mono text-2xl font-semibold tabular-nums", toneClass)}>
        {formatMoney(value)}
      </span>
      {hint ? <span className="text-xs text-copy-muted">{hint}</span> : null}
    </div>
  )
}

export function BudgetSummary({ availableBudget, entries }: BudgetSummaryProps) {
  const income = sumByType(entries, "INCOME")
  const expenses = sumByType(entries, "EXPENSE")
  const net = sumEntries(entries)
  const remaining = availableBudget + net

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-6 lg:grid-cols-5">
        <Figure
          label="Available budget"
          value={availableBudget}
          hint="Approved by your union"
        />
        <Figure label="Income" value={income} tone="income" />
        <Figure label="Expenses" value={expenses} tone="expense" />
        <Figure label="Net total" value={net} tone="auto" hint="Income minus expenses" />
        <Figure
          label="Remaining"
          value={remaining}
          tone="auto"
          hint="Available budget plus net"
        />
      </CardContent>
    </Card>
  )
}
