import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

import { getActiveInstitution } from "@/lib/institution-scope";
import { prisma } from "@/lib/prisma";
import { CLUB_NAME_FIELD_KEY } from "@/lib/form-schema-defaults";
import type { FormAnswers } from "@/lib/validate-form-answers";

function parseBaselineBudgetAmount(body: unknown): number | null {
  if (!body || typeof body !== "object" || !("baselineBudgetAmount" in body)) {
    return null;
  }

  const { baselineBudgetAmount } = body as { baselineBudgetAmount: unknown };
  if (
    typeof baselineBudgetAmount !== "number" ||
    !Number.isFinite(baselineBudgetAmount) ||
    baselineBudgetAmount < 0
  ) {
    return null;
  }

  return baselineBudgetAmount;
}

function pickClubName(answers: FormAnswers): string {
  const value = answers[CLUB_NAME_FIELD_KEY];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  // Enforce the reserved field as required; do not fall back to a placeholder.
  // The approve flow must fail if the union has deleted or failed to provide this field.
  throw new Error(
    `Required field "${CLUB_NAME_FIELD_KEY}" is missing or empty in club application answers. ` +
    `This field cannot be removed from CLUB_APPLICATION schemas.`
  );
}

// Clerk's ClerkAPIResponseError and Prisma's errors both carry the actually
// useful detail (Clerk: a nested `errors` array of { code, message,
// longMessage }; Prisma: `code`/`meta`) outside the top-level `message`
// that a plain `console.error(err)` surfaces — logging just the top-level
// error previously hid the real cause behind a generic "Forbidden".
function logApprovalError(context: string, err: unknown) {
  console.error(context, err);
  if (err && typeof err === "object" && "errors" in err && Array.isArray((err as { errors: unknown }).errors)) {
    console.error(`${context} — Clerk error detail:`, JSON.stringify((err as { errors: unknown[] }).errors, null, 2));
  }
  if (err && typeof err === "object" && "code" in err) {
    console.error(`${context} — code/meta:`, (err as { code: unknown }).code, (err as { meta?: unknown }).meta);
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/union/applications/[applicationId]/approve">
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 })
  }

  const baselineBudgetAmount = parseBaselineBudgetAmount(body)
  if (baselineBudgetAmount === null) {
    return NextResponse.json(
      { error: "A valid baseline budget amount is required." },
      { status: 400 }
    )
  }

  // If the application has already been approved/declined/etc, stop early
  // before performing external side effects (Clerk org/invitation).
  if (application.status !== "PENDING") {
    return NextResponse.json(
      { error: "This application has already been decided." },
      { status: 409 }
    )
  }

  const client = await clerkClient()
  let org: { id: string } | null = null

  try {
    const clubName = pickClubName(application.answers as unknown as FormAnswers)

    // Clerk org creation and the admin invitation can't participate in the
    // Prisma transaction below — they're external API calls. If anything
    // after this point fails, we attempt to delete the org we just created
    // rather than leave an orphan (see architecture-context.md invariant 4).
    org = await client.organizations.createOrganization({ name: clubName })

    // No inviterUserId here: the reviewing union staff member belongs to
    // the Union Staff org, not this brand-new Club org, and Clerk's
    // createOrganizationInvitation rejects inviterUserId with a 403
    // ("not_a_member_in_organization") unless that user is already a
    // member of the target org — which is never true at this point in the
    // approval flow.
    await client.organizations.createOrganizationInvitation({
      organizationId: org.id,
      emailAddress: application.proposedAdminEmail,
      role: "org:admin",
    });

    const club = await prisma.$transaction(async (tx) => {
      // Atomically claim the application by conditioning the update on PENDING status
      const claimResult = await tx.clubApplication.updateMany({
        where: { id: application.id, status: "PENDING" },
        data: { status: "APPROVED" },
      });

      if (claimResult.count === 0) {
        throw new Error("Application is no longer in PENDING state — already claimed or decided.");
      }

      const createdClub = await tx.club.create({
        data: {
          institutionId: institution.id,
          clerkOrgId: org!.id,
          name: clubName,
          approvalStatus: "APPROVED",
          baselineBudgetAmount,
        },
      });

      await tx.clubApplication.update({
        where: { id: application.id },
        data: { resultingClubId: createdClub.id },
      });

      return createdClub;
    });

    return NextResponse.json({ club: { id: club.id, clerkOrgId: club.clerkOrgId } });
  } catch (err) {
    logApprovalError(
      `Approval failed for application ${application.id}${org ? ` after creating Clerk org ${org.id}` : ""} — cleaning up.`,
      err
    )

    if (org) {
      try {
        await client.organizations.deleteOrganization(org.id)
      } catch (cleanupErr) {
        console.error(`Failed to clean up orphaned Clerk org ${org.id}:`, cleanupErr)
      }
    }

    if (
      err instanceof Error &&
      err.message.includes(`Required field "${CLUB_NAME_FIELD_KEY}" is missing or empty`)
    ) {
      return NextResponse.json(
        { error: "A valid club name is required." },
        { status: 400 }
      )
    }

    if (
      err instanceof Error &&
      err.message.includes("no longer in PENDING state")
    ) {
      return NextResponse.json(
        { error: "This application has already been decided." },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Approval failed. No changes were made." },
      { status: 500 }
    )
  }
}
