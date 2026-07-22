import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getActiveOrgId() {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("No active Clerk organization — this action requires a club context.");
  }

  return orgId;
}

export async function getActiveClub() {
  const orgId = await getActiveOrgId();

  const club = await prisma.club.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!club) {
    throw new Error(`No Club found for active organization ${orgId}.`);
  }

  return club;
}
