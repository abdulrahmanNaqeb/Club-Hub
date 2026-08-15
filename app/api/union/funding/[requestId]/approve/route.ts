import { NextResponse } from "next/server";

import { getActiveInstitution } from "@/lib/institution-scope";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/union/funding/[requestId]/approve">
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

  const fundingRequest = await prisma.fundingRequest.findUnique({
    where: { id: requestId },
    include: { club: true },
  });

  if (!fundingRequest || fundingRequest.club.institutionId !== institution.id) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Atomically claim the request by conditioning the update on PENDING status
      const claimResult = await tx.fundingRequest.updateMany({
        where: { id: fundingRequest.id, status: "PENDING" },
        data: { status: "APPROVED" },
      });

      if (claimResult.count === 0) {
        throw new Error("Funding request is no longer in PENDING state — already claimed or decided.");
      }

      await tx.club.update({
        where: { id: fundingRequest.clubId },
        data: { baselineBudgetAmount: { increment: fundingRequest.amount } },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("no longer in PENDING state")) {
      return NextResponse.json(
        { error: "This request has already been decided." },
        { status: 409 }
      );
    }

    throw err;
  }

  return NextResponse.json({ success: true });
}
