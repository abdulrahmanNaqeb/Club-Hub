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
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnswerSummary } from "@/components/forms/answer-summary"
import type { EventRequestListItem } from "@/components/union/events-queue"

interface EventReviewDialogProps {
  request: EventRequestListItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onDecided: () => void
}

type View = "detail" | "approve" | "reject"

export function EventReviewDialog({
  request,
  open,
  onOpenChange,
  onDecided,
}: EventReviewDialogProps) {
  const [view, setView] = useState<View>("detail")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/union/events/${request.id}/approve`,
        { method: "POST" }
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
        `/api/union/events/${request.id}/reject`,
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
            {view === "detail" && request.eventName}
            {view === "approve" && "Approve event"}
            {view === "reject" && "Reject event request"}
          </DialogTitle>
        </DialogHeader>

        {view === "detail" && (
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-5 pr-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-copy-secondary">
                  Club
                </span>
                <span className="text-sm text-copy-primary">
                  {request.clubName}
                </span>
              </div>
              <AnswerSummary
                fields={request.schemaSnapshot}
                answers={request.answers}
              />
            </div>
          </ScrollArea>
        )}

        {view === "approve" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-copy-secondary">
              Approving creates a confirmed event for {request.clubName}.
            </p>
            {error && <p className="text-sm text-error">{error}</p>}
          </div>
        )}

        {view === "reject" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-copy-secondary">
              This will reject {request.clubName}&apos;s event request. This
              cannot be undone.
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
