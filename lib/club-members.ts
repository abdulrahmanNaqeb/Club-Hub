import { clerkClient } from "@clerk/nextjs/server"

export interface ClubMember {
  id: string
  name: string
}

// No prior pattern to reuse here — 04-team-view.md doesn't exist and
// team-view isn't built yet, despite 16-event-detail-checklist.md's spec
// text assuming one. This establishes the org-membership-list pattern for
// whoever builds team-view next.
export async function getClubMembers(clerkOrgId: string): Promise<ClubMember[]> {
  const client = await clerkClient()
  const { data: memberships } = await client.organizations.getOrganizationMembershipList({
    organizationId: clerkOrgId,
    limit: 100,
  })

  return memberships
    .filter((membership) => membership.publicUserData)
    .map((membership) => {
      const user = membership.publicUserData!
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
      return { id: user.userId, name: fullName || user.identifier }
    })
}
