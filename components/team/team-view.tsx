"use client"

import { useClerk } from "@clerk/nextjs"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import type { ClubMember } from "@/lib/club-members"

export interface TeamMember extends ClubMember {
}

interface TeamViewProps {
  members: TeamMember[]
  isAdmin: boolean
}

function formatRole(role: string) {
  const label = role.replace(/^org:/, "")
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function MemberAvatar({ member }: { member: TeamMember }) {
  return (
    <Avatar size="sm">
      {member.imageUrl && <AvatarImage src={member.imageUrl} alt={member.name} />}
      <AvatarFallback>{initials(member.name)}</AvatarFallback>
    </Avatar>
  )
}

export function TeamView({ members, isAdmin }: TeamViewProps) {
  const clerk = useClerk()
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          {isAdmin && (
            <CardAction>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  clerk.openOrganizationProfile({
                    __experimental_startPath: "/organization-members",
                  })
                }
              >
                Manage Members
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MemberAvatar member={member} />
                      <span className="text-copy-primary">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatRole(member.role)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
