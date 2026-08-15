import { NextResponse } from "next/server";

import { getActiveInstitution } from "@/lib/institution-scope";
import { prisma } from "@/lib/prisma";
import type { ApprovalStatus } from "@/generated/prisma/client";

const APPROVAL_STATUSES: ApprovalStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function isApprovalStatus(value: string): value is ApprovalStatus {
  return (APPROVAL_STATUSES as string[]).includes(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "PENDING";

  if (!isApprovalStatus(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  let institution;
  try {
    institution = await getActiveInstitution();
  } catch {
    return NextResponse.json(
      { error: "Not authorized for this institution." },
      { status: 403 }
    );
  }

  const requests = await prisma.eventApprovalRequest.findMany({
    where: { status, club: { institutionId: institution.id } },
    include: { club: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}
