import { NextResponse } from "next/server";

import { getActiveInstitution } from "@/lib/institution-scope";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/union/events/[requestId]/reject">
) {
  const { requestId } = await ctx.params;

  let institution;
  try {
    institution = await getActiveInstitution();
  } catch {
    return NextResponse.json(
      { error: "Not authorized for this institution." },
      { status: 403 }
    );
  }

  const approvalRequest = await prisma.eventApprovalRequest.findUnique({
    where: { id: requestId },
    include: { club: true },
  });

  if (!approvalRequest || approvalRequest.club.institutionId !== institution.id) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  const result = await prisma.eventApprovalRequest.updateMany({
    where: { id: approvalRequest.id, status: "PENDING" },
    data: { status: "REJECTED" },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "This request has already been decided." },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
