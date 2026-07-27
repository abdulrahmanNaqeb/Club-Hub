"use client"

import { useState, useEffect } from "react"
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
import { ApplicationReviewDialog } from "@/components/union/application-review-dialog"
import type { FormField } from "@/lib/form-schema-defaults"
import type { FormAnswers } from "@/lib/validate-form-answers"

export interface ApplicationListItem {
  id: string
  clubName: string
  submittedDate: string
  proposedAdminEmail: string
  answers: FormAnswers
  schemaSnapshot: FormField[]
}

interface ApplicationsQueueProps {
  applications: ApplicationListItem[]
}

export function ApplicationsQueue({
  applications: initialApplications,
}: ApplicationsQueueProps) {
  const router = useRouter()
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected =
    initialApplications.find((application) => application.id === selectedId) ?? null

  // Derive the displayed applications from the latest props while
  // excluding any locally-removed ids. Clear local removals when the
  // prop snapshot changes so the list follows server state.
  const displayed = initialApplications.filter((a) => !removedIds.has(a.id))

  // Reset local removed ids when the incoming prop list changes.
  // This keeps the component in sync with server refreshes.
  useEffect(() => {
    setRemovedIds(new Set())
  }, [initialApplications])

  function handleDecided(applicationId: string) {
    setRemovedIds((prev) => new Set(prev).add(applicationId))
    setSelectedId(null)
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {displayed.length === 0 ? (
            <p className="text-sm text-copy-secondary">
              No pending club applications right now.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club name</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium text-copy-primary">
                      {application.clubName}
                    </TableCell>
                    <TableCell className="text-copy-secondary">
                      {application.submittedDate}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedId(application.id)}
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
        <ApplicationReviewDialog
          application={selected}
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
