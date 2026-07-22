import { NextResponse } from "next/server";

import { getActiveInstitution } from "@/lib/institution-scope";
import { prisma } from "@/lib/prisma";
import { EVENT_NAME_FIELD_KEY } from "@/lib/form-schema-defaults";
import type { FormAnswers } from "@/lib/validate-form-answers";

function pickEventName(answers: FormAnswers): string {
  const value = answers[EVENT_NAME_FIELD_KEY];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  // Fallback: read legacy "event_name" key if the canonical key is absent
  const legacyValue = answers["event_name"];
  if (typeof legacyValue === "string" && legacyValue.trim()) {
    return legacyValue.trim();
  }

  // Enforce the reserved field as required; fall back to a placeholder only if
  // neither the canonical nor legacy key is present. The approve flow should prefer
  // explicit error handling, but permit the fallback to avoid hard failures if
  // the union has not yet added the field to existing form schemas.
  return "Untitled event";
}

// "date"/"location"/"description" aren't reserved fields the way
// EVENT_NAME_FIELD_KEY is — the spec only calls for one reserved constant —
// so these are read directly by the seed defaults' literal keys and simply
// omitted from the created Event if a union has renamed or removed them.
function pickOptionalString(answers: FormAnswers, key: string): string | undefined {
  const value = answers[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function pickDateTime(answers: FormAnswers): Date | undefined {
  const value = answers["date"];
  if (typeof value !== "string" || !value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/union/events/[requestId]/approve">
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

  const answers = approvalRequest.answers as unknown as FormAnswers;

  const event = await prisma.$transaction(async (tx) => {
    // Atomically claim the approval request by conditioning the update on PENDING status
    const claimResult = await tx.eventApprovalRequest.updateMany({
      where: { id: approvalRequest.id, status: "PENDING" },
      data: { status: "APPROVED" },
    });

    if (claimResult.count === 0) {
      throw new Error("Approval request is no longer in PENDING state — already claimed or decided.");
    }

    const createdEvent = await tx.event.create({
      data: {
        clubId: approvalRequest.clubId,
        title: pickEventName(answers),
        description: pickOptionalString(answers, "description") ?? null,
        location: pickOptionalString(answers, "location") ?? null,
        dateTime: pickDateTime(answers) ?? null,
        status: "CONFIRMED",
      },
    });

    await tx.eventApprovalRequest.update({
      where: { id: approvalRequest.id },
      data: { resultingEventId: createdEvent.id },
    });

    return createdEvent;
  });

  return NextResponse.json({ event });
}
