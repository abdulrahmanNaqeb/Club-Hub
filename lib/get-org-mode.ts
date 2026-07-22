import { redirect } from "next/navigation";

import type { Club, Institution } from "@/generated/prisma/client";
import { getActiveClub } from "./org-scope";
import { getActiveInstitution } from "./institution-scope";

export type OrgMode =
  | { mode: "union"; institution: Institution }
  | { mode: "club"; club: Club }
  | { mode: "none" };

// Single source of truth for which chrome (union vs club) the active Clerk
// org should render. Reuses the existing membership lookups in
// institution-scope.ts / org-scope.ts rather than re-querying Union Staff
// Org links or Clubs directly.
export async function getOrgMode(): Promise<OrgMode> {
  async function tryGetActiveInstitution() {
    try {
      return await getActiveInstitution();
    } catch (err) {
      // If the active Clerk org is known but not linked to a Union Staff
      // institution, treat that as "no mapping" and return null so the
      // caller can decide. Any other error (auth issues, Prisma errors,
      // etc.) should propagate.
      if (err instanceof Error && err.message.includes("not a recognized Union Staff org")) {
        return null;
      }

      throw err;
    }
  }

  async function tryGetActiveClub() {
    try {
      return await getActiveClub();
    } catch (err) {
      // If the active Clerk org exists but isn't linked to a Club, that's
      // a confirmed missing mapping — return null. Other failures should
      // bubble up.
      if (err instanceof Error && err.message.includes("No Club found for active organization")) {
        return null;
      }

      throw err;
    }
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

  return { mode: "none" };
}

export async function requireOrgMode(required: "union"): Promise<Institution>;
export async function requireOrgMode(required: "club"): Promise<Club>;
export async function requireOrgMode(
  required: "union" | "club"
): Promise<Institution | Club> {
  const orgMode = await getOrgMode();

  if (orgMode.mode === "none") {
    redirect("/org-not-configured");
  }

  if (orgMode.mode !== required) {
    redirect(orgMode.mode === "union" ? "/union/applications" : "/team");
  }

  return orgMode.mode === "union" ? orgMode.institution : orgMode.club;
}
