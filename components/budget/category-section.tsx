"use client"

import { Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatMoney, sumByType, sumEntries } from "@/components/budget/budget-types"
import type { BudgetCategoryView, BudgetEntryView } from "@/components/budget/budget-types"

interface CategorySectionProps {
  categories: BudgetCategoryView[]
  entries: BudgetEntryView[]
  onAdd: () => void
  onEdit: (category: BudgetCategoryView) => void
  onDelete: (category: BudgetCategoryView) => void
}

function Amount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>{formatMoney(value)}</span>
  )
}

export function CategorySection({
  categories,
  entries,
  onAdd,
  onEdit,
  onDelete,
}: CategorySectionProps) {
  const uncategorized = entries.filter((entry) => entry.categoryId === null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardAction>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {categories.length === 0 && uncategorized.length === 0 ? (
          <p className="py-6 text-center text-sm text-copy-muted">
            No categories yet. Add one to start allocating your budget.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {categories.map((category) => {
                const categoryEntries = entries.filter(
                  (entry) => entry.categoryId === category.id
                )
                const income = sumByType(categoryEntries, "INCOME")
                const expenses = sumByType(categoryEntries, "EXPENSE")
                const net = sumEntries(categoryEntries)
                const overAllocated = expenses > category.allocatedAmount

                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium text-copy-primary">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-right text-copy-secondary">
                      <Amount value={category.allocatedAmount} />
                    </TableCell>
                    <TableCell className="text-right text-copy-secondary">
                      <Amount value={income} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Amount
                        value={expenses}
                        className={overAllocated ? "text-error" : "text-copy-secondary"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Amount
                        value={net}
                        className={net < 0 ? "text-error" : "text-copy-primary"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${category.name}`}
                          onClick={() => onEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${category.name}`}
                          onClick={() => onDelete(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}

              {uncategorized.length > 0 ? (
                <TableRow>
                  <TableCell className="text-copy-muted italic">Uncategorized</TableCell>
                  <TableCell className="text-right text-copy-faint">—</TableCell>
                  <TableCell className="text-right text-copy-secondary">
                    <Amount value={sumByType(uncategorized, "INCOME")} />
                  </TableCell>
                  <TableCell className="text-right text-copy-secondary">
                    <Amount value={sumByType(uncategorized, "EXPENSE")} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Amount
                      value={sumEntries(uncategorized)}
                      className={
                        sumEntries(uncategorized) < 0 ? "text-error" : "text-copy-primary"
                      }
                    />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
