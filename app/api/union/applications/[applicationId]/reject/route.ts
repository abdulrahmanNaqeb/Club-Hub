import { NextResponse } from "next/server";

import { getActiveInstitution } from "@/lib/institution-scope";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/union/applications/[applicationId]/reject">
) {
  const { applicationId } = await ctx.params;

  let institution;
  try {
    institution = await getActiveInstitution();
  } catch {
    return NextResponse.json(
      { error: "Not authorized for this institution." },
      { status: 403 }
    );
  }

  const application = await prisma.clubApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application || application.institutionId !== institution.id) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const result = await prisma.clubApplication.updateMany({
    where: { id: application.id, status: "PENDING" },
    data: { status: "REJECTED" },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "This application has already been decided." },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
