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

export interface OverspendFlagListItem {
  id: string
  clubName: string
  flaggedDate: string
}

interface OverspendFlagsProps {
  flags: OverspendFlagListItem[]
}

export function OverspendFlags({ flags: initialFlags }: OverspendFlagsProps) {
  const router = useRouter()
  const [flags, setFlags] = useState(initialFlags)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)

  async function handleResolve(flagId: string) {
    setResolvingId(flagId)
    setResolveError(null)

    try {
      const response = await fetch(`/api/union/overspend-flags/${flagId}/resolve`, {
        method: "POST",
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setResolveError(body?.error ?? "Unable to resolve this flag. Please try again.")
        return
      }

      setFlags((current) => current.filter((flag) => flag.id !== flagId))
      router.refresh()
    } catch (err) {
      setResolveError("Unable to resolve this flag. Please try again.")
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overspend Flags</CardTitle>
      </CardHeader>
      <CardContent>
        {resolveError && (
          <p className="mb-4 text-sm text-error">{resolveError}</p>
        )}
        {flags.length === 0 ? (
          <p className="text-sm text-copy-secondary">No unresolved overspend flags.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club</TableHead>
                <TableHead>Flagged</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map((flag) => (
                <TableRow key={flag.id}>
                  <TableCell className="font-medium text-copy-primary">
                    {flag.clubName}
                  </TableCell>
                  <TableCell className="text-copy-secondary">{flag.flaggedDate}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resolvingId === flag.id}
                      onClick={() => handleResolve(flag.id)}
                    >
                      Mark resolved
                    </Button>
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
