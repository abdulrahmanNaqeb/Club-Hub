import { NextResponse } from "next/server";

import { getActiveInstitution } from "@/lib/institution-scope";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/union/overspend-flags/[flagId]/resolve">
) {
  const { flagId } = await ctx.params;

  let institution;
  try {
    institution = await getActiveInstitution();
  } catch {
    return NextResponse.json(
      { error: "Not authorized for this institution." },
      { status: 403 }
    );
  }

  const flag = await prisma.overspendFlag.findUnique({
    where: { id: flagId },
    include: { club: true },
  });

  if (!flag || flag.club.institutionId !== institution.id) {
    return NextResponse.json({ error: "Flag not found." }, { status: 404 });
  }

  const result = await prisma.overspendFlag.updateMany({
    where: { id: flag.id, resolvedAt: null },
    data: { resolvedAt: new Date(), openKey: null },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "This flag has already been resolved." },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
