"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BudgetSummary } from "@/components/budget/budget-summary"
import { CategorySection } from "@/components/budget/category-section"
import { EntrySection } from "@/components/budget/entry-section"
import { CategoryDeleteDialog, CategoryDialog } from "@/components/budget/category-dialog"
import { EntryDialog } from "@/components/budget/entry-dialog"
import { formatMoney } from "@/components/budget/budget-types"
import type {
  BudgetCategoryView,
  BudgetEntryView,
  BudgetEventOption,
} from "@/components/budget/budget-types"

interface BudgetViewProps {
  availableBudget: number
  initialCategories: BudgetCategoryView[]
  initialEntries: BudgetEntryView[]
  events: BudgetEventOption[]
}

export function BudgetView({
  availableBudget,
  initialCategories,
  initialEntries,
  events,
}: BudgetViewProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [entries, setEntries] = useState(initialEntries)

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BudgetCategoryView | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<BudgetCategoryView | null>(null)

  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<BudgetEntryView | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<BudgetEntryView | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function upsertCategory(saved: BudgetCategoryView) {
    setCategories((current) =>
      current.some((category) => category.id === saved.id)
        ? current.map((category) => (category.id === saved.id ? saved : category))
        : [...current, saved]
    )
    setCategoryDialogOpen(false)
    setEditingCategory(null)
  }

  function removeCategory(categoryId: string) {
    setCategories((current) => current.filter((category) => category.id !== categoryId))
    // Mirrors the schema's onDelete: SetNull — the entries survive, they just
    // become uncategorized, so the totals stay correct without a refetch.
    setEntries((current) =>
      current.map((entry) =>
        entry.categoryId === categoryId ? { ...entry, categoryId: null } : entry
      )
    )
    setDeletingCategory(null)
  }

  function upsertEntry(saved: BudgetEntryView) {
    setEntries((current) => {
      const next = current.some((entry) => entry.id === saved.id)
        ? current.map((entry) => (entry.id === saved.id ? saved : entry))
        : [...current, saved]
      return [...next].sort((a, b) => b.date.localeCompare(a.date))
    })
    setEntryDialogOpen(false)
    setEditingEntry(null)
  }

  async function handleDeleteEntry() {
    if (!deletingEntry) return
    setDeleteError(null)
    try {
      const res = await fetch(`/api/budget/entries/${deletingEntry.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Request failed")
      setEntries((current) => current.filter((entry) => entry.id !== deletingEntry.id))
      setDeletingEntry(null)
    } catch {
      setDeleteError("Couldn't delete the entry. Please try again.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BudgetSummary availableBudget={availableBudget} entries={entries} />

      <CategorySection
        categories={categories}
        entries={entries}
        onAdd={() => {
          setEditingCategory(null)
          setCategoryDialogOpen(true)
        }}
        onEdit={(category) => {
          setEditingCategory(category)
          setCategoryDialogOpen(true)
        }}
        onDelete={setDeletingCategory}
      />

      <EntrySection
        entries={entries}
        categories={categories}
        events={events}
        onAdd={() => {
          setEditingEntry(null)
          setEntryDialogOpen(true)
        }}
        onEdit={(entry) => {
          setEditingEntry(entry)
          setEntryDialogOpen(true)
        }}
        onDelete={setDeletingEntry}
      />

      <CategoryDialog
        open={categoryDialogOpen}
        category={editingCategory}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open)
          if (!open) setEditingCategory(null)
        }}
        onSaved={upsertCategory}
      />

      <CategoryDeleteDialog
        category={deletingCategory}
        affectedEntryCount={
          deletingCategory
            ? entries.filter((entry) => entry.categoryId === deletingCategory.id).length
            : 0
        }
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null)
        }}
        onDeleted={removeCategory}
      />

      <EntryDialog
        open={entryDialogOpen}
        entry={editingEntry}
        categories={categories}
        events={events}
        onOpenChange={(open) => {
          setEntryDialogOpen(open)
          if (!open) setEditingEntry(null)
        }}
        onSaved={upsertEntry}
      />

      {/* Entries are financial records (and may carry receipts), so deletion
          confirms — unlike the deliberately friction-free checklist deletes
          in 16-event-detail-checklist.md. */}
      <Dialog
        open={deletingEntry !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingEntry(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="rounded-3xl bg-elevated text-copy-primary sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this entry?</DialogTitle>
            <DialogDescription>
              {deletingEntry
                ? `${formatMoney(deletingEntry.amount)}${
                    deletingEntry.note ? ` — ${deletingEntry.note}` : ""
                  }. This can't be undone${
                    deletingEntry.receiptUrls.length > 0
                      ? ", and its attached receipts will be removed too"
                      : ""
                  }.`
                : null}
            </DialogDescription>
          </DialogHeader>

          {deleteError ? <p className="py-2 text-sm text-error">{deleteError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingEntry(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEntry}>
              Delete entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
