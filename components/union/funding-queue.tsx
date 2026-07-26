"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FundingReviewDialog } from "@/components/union/funding-review-dialog"
import type { FormField } from "@/lib/form-schema-defaults"
import type { FormAnswers } from "@/lib/validate-form-answers"

export interface FundingRequestListItem {
  id: string
  clubName: string
  amount: number
  submittedDate: string
  answers: FormAnswers
  schemaSnapshot: FormField[]
}

interface FundingQueueProps {
  requests: FundingRequestListItem[]
}

export function formatFundingAmount(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}

export function FundingQueue({ requests: initialRequests }: FundingQueueProps) {
  const router = useRouter()
  const [removedRequestIds, setRemovedRequestIds] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const requests = initialRequests.filter((request) => !removedRequestIds.includes(request.id))
  const selected = requests.find((request) => request.id === selectedId) ?? null

  function handleDecided(requestId: string) {
    setRemovedRequestIds((current) => [...current, requestId])
    setSelectedId(null)
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Funding</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-copy-secondary">
              No pending funding requests right now.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-copy-primary">
                      {request.clubName}
                    </TableCell>
                    <TableCell className="font-medium text-copy-primary">
                      {formatFundingAmount(request.amount)}
                    </TableCell>
                    <TableCell className="text-copy-secondary">
                      {request.submittedDate}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedId(request.id)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected && (
        <FundingReviewDialog
          request={selected}
          open={selectedId === selected.id}
          onOpenChange={(open) => {
            if (!open) setSelectedId(null)
          }}
          onDecided={() => handleDecided(selected.id)}
        />
      )}
    </>
  )
}
