"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnswerSummary } from "@/components/forms/answer-summary"
import type { ApplicationListItem } from "@/components/union/applications-queue"

interface ApplicationReviewDialogProps {
  application: ApplicationListItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onDecided: () => void
}

type View = "detail" | "approve" | "reject"

export function ApplicationReviewDialog({
  application,
  open,
  onOpenChange,
  onDecided,
}: ApplicationReviewDialogProps) {
  const [view, setView] = useState<View>("detail")
  const [baselineBudgetAmount, setBaselineBudgetAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    const amount = Number(baselineBudgetAmount)
    if (
      baselineBudgetAmount.trim() === "" ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setError("Enter a valid baseline budget amount.")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/union/applications/${application.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baselineBudgetAmount: amount }),
        }
      )
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Approval failed.")
      }
      onDecided()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.")
      setSubmitting(false)
    }
  }

  async function handleReject() {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/union/applications/${application.id}/reject`,
        { method: "POST" }
      )
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Rejection failed.")
      }
      onDecided()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rejection failed.")
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {view === "detail" && application.clubName}
            {view === "approve" && "Set baseline budget"}
            {view === "reject" && "Reject application"}
          </DialogTitle>
        </DialogHeader>

        {view === "detail" && (
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-5 pr-3">
              <AnswerSummary
                fields={application.schemaSnapshot}
                answers={application.answers}
              />
              <div className="flex flex-col gap-1 border-t border-surface-border pt-4">
                <span className="text-sm font-medium text-copy-secondary">
                  Proposed admin email
                </span>
                <span className="text-sm text-copy-primary">
                  {application.proposedAdminEmail}
                </span>
              </div>
            </div>
          </ScrollArea>
        )}

        {view === "approve" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-copy-secondary">
              Approving creates {application.clubName}&apos;s workspace and
              invites {application.proposedAdminEmail} as its admin.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="baseline-budget">Baseline budget amount</Label>
              <Input
                id="baseline-budget"
                type="number"
                min={0}
                step="0.01"
                value={baselineBudgetAmount}
                onChange={(event) =>
                  setBaselineBudgetAmount(event.target.value)
                }
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
          </div>
        )}

        {view === "reject" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-copy-secondary">
              This will reject {application.clubName}&apos;s application.
              This cannot be undone.
            </p>
            {error && <p className="text-sm text-error">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {view === "detail" && (
            <>
              <Button variant="destructive" onClick={() => setView("reject")}>
                Reject
              </Button>
              <Button onClick={() => setView("approve")}>Approve</Button>
            </>
          )}
          {view === "approve" && (
            <>
              <Button
                variant="outline"
                onClick={() => setView("detail")}
                disabled={submitting}
              >
                Back
              </Button>
              <Button onClick={handleApprove} disabled={submitting}>
                {submitting ? "Approving…" : "Confirm approval"}
              </Button>
            </>
          )}
          {view === "reject" && (
            <>
              <Button
                variant="outline"
                onClick={() => setView("detail")}
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={submitting}
              >
                {submitting ? "Rejecting…" : "Confirm reject"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
