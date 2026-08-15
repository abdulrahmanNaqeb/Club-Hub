import { auth } from "@clerk/nextjs/server";

import { requireOrgMode } from "@/lib/get-org-mode";
import { getClubMembers } from "@/lib/club-members";
import { AppShell } from "@/components/app/app-shell";
import { TeamView, type TeamMember } from "@/components/team/team-view";

// Deterministic placeholder until EventTask data is meaningful enough to
// aggregate a real "tasks done" count from (a follow-up, not this spec,
// per 04-team-view.md) — stable per member so the leaderboard doesn't
// reshuffle on every reload, same hash-based approach as lib/cursor-color.ts.
function mockTasksDone(memberId: string): number {
  let hash = 0;
  for (let i = 0; i < memberId.length; i++) {
    hash = (hash << 5) - hash + memberId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 25;
}

export default async function TeamPage() {
  const club = await requireOrgMode("club");
  const { userId } = await auth();

  const members = await getClubMembers(club.clerkOrgId);
  const currentMember = members.find((member) => member.id === userId);
  const isAdmin = currentMember?.role === "org:admin";

  const teamMembers: TeamMember[] = members.map((member) => ({
    ...member,
  }));

  return (
    <AppShell mode="club" title="Team">
      <TeamView members={teamMembers} isAdmin={isAdmin} />
    </AppShell>
  );
}
