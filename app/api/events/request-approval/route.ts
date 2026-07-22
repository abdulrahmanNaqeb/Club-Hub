import { NextResponse } from "next/server";

import { getActiveClub } from "@/lib/org-scope";
import { prisma } from "@/lib/prisma";
import { getOrSeedFormSchema, type FormField } from "@/lib/form-schema-defaults";
import { validateFormAnswers, type FormAnswers } from "@/lib/validate-form-answers";

function parseAnswers(body: unknown): FormAnswers | null {
  if (!body || typeof body !== "object" || !("answers" in body)) {
    return null;
  }

  const { answers } = body as { answers: unknown };
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return null;
  }

  return answers as FormAnswers;
}

function pickAnswers(fields: FormField[], answers: FormAnswers): FormAnswers {
  const picked: FormAnswers = {};
  for (const field of fields) {
    if (field.type === "FILE") continue;
    if (field.fieldKey in answers) {
      picked[field.fieldKey] = answers[field.fieldKey];
    }
  }
  return picked;
}

export async function POST(request: Request) {
  let club;
  try {
    club = await getActiveClub();
  } catch {
    return NextResponse.json(
      { error: "Not authorized for this club." },
      { status: 403 }
    );
  }

  const institution = await prisma.institution.findUnique({
    where: { id: club.institutionId },
  });
  if (!institution) {
    return NextResponse.json(
      { error: "This club's institution isn't set up yet." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const rawAnswers = parseAnswers(body);
  if (!rawAnswers) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const schema = await getOrSeedFormSchema(institution, "EVENT_APPROVAL");
  const fields = schema.fields as unknown as FormField[];

  const errors = validateFormAnswers(fields, rawAnswers);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", fieldErrors: errors }, { status: 400 });
  }

  const answers = pickAnswers(fields, rawAnswers);

  const approvalRequest = await prisma.eventApprovalRequest.create({
    data: {
      clubId: club.id,
      status: "PENDING",
      answers: answers as unknown as object,
      schemaSnapshot: fields as unknown as object,
    },
  });

  return NextResponse.json({ request: approvalRequest }, { status: 201 });
}
