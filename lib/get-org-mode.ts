import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import type { Club, Institution } from "@/generated/prisma/client";
import { prisma } from "./prisma";

export type OrgMode =
  | { mode: "union"; institution: Institution }
  | { mode: "club"; club: Club }
  | { mode: "organizationless" }
  | { mode: "none" };

// Single source of truth for which chrome (union vs club) the active Clerk
// org should render. Reuses the existing membership lookups in
// institution-scope.ts / org-scope.ts rather than re-querying Union Staff
// Org links or Clubs directly.
export async function getOrgMode(): Promise<OrgMode> {
  async function tryGetActiveInstitution(): Promise<Institution | null | undefined> {
    const { orgId } = await auth();
    if (!orgId) {
      return undefined;
    }

    const link = await prisma.unionStaffOrgLink.findUnique({
      where: { clerkOrgId: orgId },
      include: { institution: true },
    });

    return link?.institution ?? null;
  }

  async function tryGetActiveClub(): Promise<Club | null | undefined> {
    const { orgId } = await auth();
    if (!orgId) {
      return undefined;
    }

    const club = await prisma.club.findUnique({
      where: { clerkOrgId: orgId },
    });

    return club ?? null;
  }

  const [institution, club] = await Promise.all([
    tryGetActiveInstitution(),
    tryGetActiveClub(),
  ]);

  if (institution) {
    return { mode: "union", institution };
  }

  if (club) {
    return { mode: "club", club };
  }

  if (institution === undefined || club === undefined) {
    return { mode: "organizationless" };
  }

  return { mode: "none" };
}

export async function requireOrgMode(required: "union"): Promise<Institution>;
export async function requireOrgMode(required: "club"): Promise<Club>;
export async function requireOrgMode(
  required: "union" | "club"
): Promise<Institution | Club> {
  const orgMode = await getOrgMode();

  if (orgMode.mode === "organizationless") {
    redirect("/select-club");
  }

  if (orgMode.mode === "none") {
    redirect("/org-not-configured");
  }

  if (orgMode.mode !== required) {
    redirect(orgMode.mode === "union" ? "/union/applications" : "/team");
  }

  return orgMode.mode === "union" ? orgMode.institution : orgMode.club;
}
