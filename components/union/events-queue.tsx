"use client"

import { useState } from "react"
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
import { EventReviewDialog } from "@/components/union/event-review-dialog"
import type { FormField } from "@/lib/form-schema-defaults"
import type { FormAnswers } from "@/lib/validate-form-answers"

export interface EventRequestListItem {
  id: string
  clubName: string
  eventName: string
  submittedDate: string
  answers: FormAnswers
  schemaSnapshot: FormField[]
}

interface EventsQueueProps {
  requests: EventRequestListItem[]
}

export function EventsQueue({ requests: initialRequests }: EventsQueueProps) {
  const router = useRouter()
  const [requests, setRequests] = useState(initialRequests)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = requests.find((request) => request.id === selectedId) ?? null

  function handleDecided(requestId: string) {
    setRequests((current) => current.filter((request) => request.id !== requestId))
    setSelectedId(null)
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-copy-secondary">
              No pending event approval requests right now.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club</TableHead>
                  <TableHead>Event</TableHead>
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
                    <TableCell className="text-copy-secondary">
                      {request.eventName}
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
        <EventReviewDialog
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
