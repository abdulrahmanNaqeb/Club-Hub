import { clerkClient } from "@clerk/nextjs/server"

export interface ClubMember {
  id: string
  name: string
  role: string
  imageUrl: string | null
}

// Established here (not by 04-team-view.md, which hadn't been built yet)
// during 16-event-detail-checklist.md, for the event-assignee picker.
// Extended with role/imageUrl for 04-team-view.md's member list — reused
// as-is rather than adding a second Clerk-membership-fetching helper.
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
      return {
        id: user.userId,
        name: fullName || user.identifier,
        role: membership.role,
        imageUrl: user.hasImage ? user.imageUrl : null,
      }
    })
}
