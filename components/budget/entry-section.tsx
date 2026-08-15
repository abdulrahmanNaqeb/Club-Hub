"use client"

import { Paperclip, Pencil, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import {
  BUDGET_ENTRY_TYPE_LABELS,
  formatEntryDate,
  formatMoney,
} from "@/components/budget/budget-types"
import type {
  BudgetCategoryView,
  BudgetEntryView,
  BudgetEventOption,
} from "@/components/budget/budget-types"

interface EntrySectionProps {
  entries: BudgetEntryView[]
  categories: BudgetCategoryView[]
  events: BudgetEventOption[]
  onAdd: () => void
  onEdit: (entry: BudgetEntryView) => void
  onDelete: (entry: BudgetEntryView) => void
}

export function EntrySection({
  entries,
  categories,
  events,
  onAdd,
  onEdit,
  onDelete,
}: EntrySectionProps) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
  const eventTitles = new Map(events.map((event) => [event.id, event.title]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entries</CardTitle>
        <CardAction>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add entry
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-copy-muted">
            No entries yet. Record income or an expense to start tracking spend.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Receipts</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-copy-secondary tabular-nums">
                    {formatEntryDate(entry.date)}
                  </TableCell>

                  <TableCell>
                    <Badge variant={entry.type === "INCOME" ? "outline" : "secondary"}>
                      {BUDGET_ENTRY_TYPE_LABELS[entry.type]}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-mono tabular-nums",
                        entry.type === "INCOME" ? "text-success" : "text-copy-primary"
                      )}
                    >
                      {entry.type === "INCOME" ? "+" : "−"}
                      {formatMoney(entry.amount)}
                    </span>
                  </TableCell>

                  <TableCell className="text-copy-secondary">
                    {entry.categoryId ? (
                      (categoryNames.get(entry.categoryId) ?? (
                        <span className="text-copy-faint italic">Deleted category</span>
                      ))
                    ) : (
                      <span className="text-copy-faint">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-copy-secondary">
                    {entry.eventId ? (
                      (eventTitles.get(entry.eventId) ?? (
                        <span className="text-copy-faint italic">Deleted event</span>
                      ))
                    ) : (
                      <span className="text-copy-faint">—</span>
                    )}
                  </TableCell>

                  <TableCell className="max-w-48 truncate text-copy-secondary">
                    {entry.note ?? <span className="text-copy-faint">—</span>}
                  </TableCell>

                  <TableCell>
                    {entry.type === "EXPENSE" && entry.receiptUrls.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {entry.receiptUrls.map((url, index) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-brand hover:underline"
                          >
                            <Paperclip className="h-3 w-3" />
                            Receipt {index + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-copy-faint">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit entry"
                        onClick={() => onEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete entry"
                        onClick={() => onDelete(entry)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
