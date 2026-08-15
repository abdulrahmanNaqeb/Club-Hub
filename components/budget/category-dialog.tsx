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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMoney } from "@/components/budget/budget-types"
import type { BudgetCategoryView } from "@/components/budget/budget-types"

interface CategoryDialogProps {
  open: boolean
  /** null means "create a new category". */
  category: BudgetCategoryView | null
  onOpenChange: (open: boolean) => void
  onSaved: (category: BudgetCategoryView) => void
}

export function CategoryDialog({
  open,
  category,
  onOpenChange,
  onSaved,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl bg-elevated text-copy-primary sm:max-w-md">
        {/* Keyed so switching between add/edit targets mounts a fresh form
            instead of needing a useEffect to reset local state — same pattern
            as the event detail dialog. */}
        <CategoryForm
          key={category?.id ?? "new"}
          category={category}
          onSaved={onSaved}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

interface CategoryFormProps {
  category: BudgetCategoryView | null
  onSaved: (category: BudgetCategoryView) => void
  onCancel: () => void
}

function CategoryForm({ category, onSaved, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "")
  const [allocatedAmount, setAllocatedAmount] = useState(
    category ? String(category.allocatedAmount) : ""
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = category !== null

  async function handleSubmit() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Name cannot be empty.")
      return
    }

    const amount = Number(allocatedAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid allocated amount of zero or more.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(
        isEdit ? `/api/budget/categories/${category.id}` : "/api/budget/categories",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, allocatedAmount: amount }),
        }
      )
      if (!res.ok) throw new Error("Request failed")
      const { category: saved } = await res.json()
      onSaved(saved)
    } catch {
      setError("Couldn't save the category. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
        <DialogDescription>
          Categories group your spend and set how much of the budget is allocated to each.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-name">Name</Label>
          <Input
            id="category-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Events, Marketing, Equipment"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category-allocated">Allocated amount</Label>
          <Input
            id="category-allocated"
            type="number"
            min="0"
            step="0.01"
            value={allocatedAmount}
            onChange={(event) => setAllocatedAmount(event.target.value)}
            placeholder="0.00"
          />
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add category"}
        </Button>
      </div>
    </>
  )
}

interface CategoryDeleteDialogProps {
  category: BudgetCategoryView | null
  /** How many entries currently point at this category. */
  affectedEntryCount: number
  onOpenChange: (open: boolean) => void
  onDeleted: (categoryId: string) => void
}

export function CategoryDeleteDialog({
  category,
  affectedEntryCount,
  onOpenChange,
  onDeleted,
}: CategoryDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!category) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/budget/categories/${category.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Request failed")
      onDeleted(category.id)
    } catch {
      setError("Couldn't delete the category. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={category !== null} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl bg-elevated text-copy-primary sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {category?.name}?</DialogTitle>
          <DialogDescription>
            {affectedEntryCount === 0
              ? "This category has no entries. Deleting it can't be undone."
              : `${affectedEntryCount} ${
                  affectedEntryCount === 1 ? "entry" : "entries"
                } will be kept but become uncategorized. Its allocation of ${formatMoney(
                  category?.allocatedAmount ?? 0
                )} will be removed.`}
          </DialogDescription>
        </DialogHeader>

        {error ? <p className="py-2 text-sm text-error">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
