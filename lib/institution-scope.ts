import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export function getInstitutionBySlug(slug: string) {
  return prisma.institution.findUnique({ where: { slug } });
}

export async function getActiveInstitution() {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("No active Clerk organization — this action requires a Union Staff context.");
  }

  const link = await prisma.unionStaffOrgLink.findUnique({
    where: { clerkOrgId: orgId },
    include: { institution: true },
  });

  if (!link) {
    throw new Error(`Active organization ${orgId} is not a recognized Union Staff org.`);
  }

  return link.institution;
}
