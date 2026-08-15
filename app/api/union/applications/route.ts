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

  const applications = await prisma.clubApplication.findMany({
    where: { institutionId: institution.id, status },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ applications });
}
