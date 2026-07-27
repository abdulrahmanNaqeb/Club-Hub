"use client"

import { useRef, useState } from "react"
import { Paperclip } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BUDGET_ENTRY_TYPE_LABELS } from "@/components/budget/budget-types"
import type {
  BudgetCategoryView,
  BudgetEntryType,
  BudgetEntryView,
  BudgetEventOption,
} from "@/components/budget/budget-types"

const NO_CATEGORY = "__no_category__"
const NO_EVENT = "__no_event__"

interface EntryDialogProps {
  open: boolean
  /** null means "create a new entry". */
  entry: BudgetEntryView | null
  categories: BudgetCategoryView[]
  events: BudgetEventOption[]
  onOpenChange: (open: boolean) => void
  onSaved: (entry: BudgetEntryView) => void
}

export function EntryDialog({
  open,
  entry,
  categories,
  events,
  onOpenChange,
  onSaved,
}: EntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl bg-elevated text-copy-primary sm:max-w-lg">
        {/* Keyed so switching targets mounts a fresh form rather than needing
            a useEffect to reset state — same pattern as the other dialogs. */}
        <EntryForm
          key={entry?.id ?? "new"}
          entry={entry}
          categories={categories}
          events={events}
          onSaved={onSaved}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

interface EntryFormProps {
  entry: BudgetEntryView | null
  categories: BudgetCategoryView[]
  events: BudgetEventOption[]
  onSaved: (entry: BudgetEntryView) => void
  onCancel: () => void
}

function EntryForm({ entry, categories, events, onSaved, onCancel }: EntryFormProps) {
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "")
  const [type, setType] = useState<BudgetEntryType>(entry?.type ?? "EXPENSE")
  const [date, setDate] = useState(entry ? entry.date.slice(0, 10) : todayInputValue())
  const [note, setNote] = useState(entry?.note ?? "")
  const [categoryId, setCategoryId] = useState(entry?.categoryId ?? NO_CATEGORY)
  const [eventId, setEventId] = useState(entry?.eventId ?? NO_EVENT)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = entry !== null

  // Base UI's Select.Value can't resolve a label for a value whose item has
  // never mounted, so the options are passed explicitly (see the assignee
  // picker in 16-event-detail-checklist.md for the same fix).
  const typeItems = [
    { value: "EXPENSE", label: BUDGET_ENTRY_TYPE_LABELS.EXPENSE },
    { value: "INCOME", label: BUDGET_ENTRY_TYPE_LABELS.INCOME },
  ]
  const categoryItems = [
    { value: NO_CATEGORY, label: "Uncategorized" },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ]
  const eventItems = [
    { value: NO_EVENT, label: "No event" },
    ...events.map((event) => ({ value: event.id, label: event.title })),
  ]

  async function uploadReceipts(entryId: string): Promise<BudgetEntryView | null> {
    if (files.length === 0) return null

    const formData = new FormData()
    for (const file of files) formData.append("files", file)

    const res = await fetch(`/api/budget/entries/${entryId}/receipts`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) throw new Error("Receipt upload failed")
    const { entry: updated } = await res.json()
    return updated
  }

  async function handleSubmit() {
    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than zero.")
      return
    }
    if (!date) {
      setError("Pick a date for this entry.")
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      amount: parsedAmount,
      type,
      date: new Date(date).toISOString(),
      note: note.trim() === "" ? null : note.trim(),
      categoryId: categoryId === NO_CATEGORY ? null : categoryId,
      eventId: eventId === NO_EVENT ? null : eventId,
    }

    try {
      const res = await fetch(
        isEdit ? `/api/budget/entries/${entry.id}` : "/api/budget/entries",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) throw new Error("Request failed")
      const { entry: saved } = await res.json()

      // The blob path is receipts/{clubId}/{entryId}/{filename}, so the row
      // has to exist before anything can be uploaded against it — create (or
      // update) first, then attach.
      if (type === "EXPENSE" && files.length > 0) {
        try {
          const withReceipts = await uploadReceipts(saved.id)
          onSaved(withReceipts ?? saved)
        } catch {
          // The entry itself saved fine — surface the upload failure without
          // discarding it, so the user isn't left thinking nothing happened.
          onSaved(saved)
          setError("The entry saved, but the receipt upload failed. Try attaching it again.")
          setSaving(false)
          setFiles([])
          if (fileInputRef.current) fileInputRef.current.value = ""
          return
        }
      } else {
        onSaved(saved)
      }
    } catch {
      setError("Couldn't save the entry. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit entry" : "Add entry"}</DialogTitle>
        <DialogDescription>
          Record income or an expense, optionally against a category and an event.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-amount">Amount</Label>
            <Input
              id="entry-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <Select
              items={typeItems}
              value={type}
              onValueChange={(value) => setType((value as BudgetEntryType | null) ?? "EXPENSE")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">{BUDGET_ENTRY_TYPE_LABELS.EXPENSE}</SelectItem>
                <SelectItem value="INCOME">{BUDGET_ENTRY_TYPE_LABELS.INCOME}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entry-date">Date</Label>
          <Input
            id="entry-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select
              items={categoryItems}
              value={categoryId}
              onValueChange={(value) => setCategoryId(value ?? NO_CATEGORY)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>Uncategorized</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Linked event</Label>
            <Select
              items={eventItems}
              value={eventId}
              onValueChange={(value) => setEventId(value ?? NO_EVENT)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_EVENT}>No event</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="entry-note">Note</Label>
          <Textarea
            id="entry-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional"
            rows={2}
          />
        </div>

        {/* Receipts are proof of spend — the field doesn't exist at all for
            income entries, per 17-budget-categories-entries.md. */}
        {type === "EXPENSE" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-receipts">Receipts</Label>
            <Input
              id="entry-receipts"
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
            {isEdit && entry.receiptUrls.length > 0 ? (
              <div className="flex flex-col gap-0.5 pt-1">
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
            ) : null}
          </div>
        ) : null}

        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add entry"}
        </Button>
      </div>
    </>
  )
}
