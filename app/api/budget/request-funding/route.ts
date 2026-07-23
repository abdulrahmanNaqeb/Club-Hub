import { NextResponse } from "next/server";

import { getActiveClub } from "@/lib/org-scope";
import { prisma } from "@/lib/prisma";
import {
  getOrSeedFormSchema,
  FUNDING_AMOUNT_FIELD_KEY,
  type FormField,
} from "@/lib/form-schema-defaults";
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

function pickFundingAmount(answers: FormAnswers): number | null {
  const value = answers[FUNDING_AMOUNT_FIELD_KEY];
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return value;
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

  // Accept an optional client-provided idempotency key at the top-level of
  // the request body to make duplicate POSTs idempotent for the same club.
  const maybeIdempotencyKey =
    body && typeof body === "object" && "idempotencyKey" in (body as any) && typeof (body as any).idempotencyKey === "string"
      ? ((body as any).idempotencyKey as string).trim() || null
      : null;

  const schema = await getOrSeedFormSchema(institution, "FUNDING_REQUEST");
  const fields = schema.fields as unknown as FormField[];

  const errors = validateFormAnswers(fields, rawAnswers);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed.", fieldErrors: errors },
      { status: 400 }
    );
  }

  const answers = pickAnswers(fields, rawAnswers);

  const amount = pickFundingAmount(answers);
  if (amount === null) {
    return NextResponse.json(
      { error: "Enter a valid funding amount greater than zero." },
      { status: 400 }
    );
  }

  // If an idempotency key was provided, try to find an existing request for
  // this club with the same key and return it. Otherwise, create a new one.
  if (maybeIdempotencyKey) {
    const existing = await prisma.fundingRequest.findFirst({
      where: { clubId: club.id, idempotencyKey: maybeIdempotencyKey },
    });
    if (existing) {
      return NextResponse.json({ request: existing }, { status: 200 });
    }

    try {
      const created = await prisma.fundingRequest.create({
        data: {
          clubId: club.id,
          amount,
          idempotencyKey: maybeIdempotencyKey,
          status: "PENDING",
          answers: answers as unknown as object,
          schemaSnapshot: fields as unknown as object,
        },
      });
      return NextResponse.json({ request: created }, { status: 201 });
    } catch (err: any) {
      // Handle unique-constraint races: if another request with the same
      // idempotency key was created concurrently, return that record.
      if (err && err.code === "P2002") {
        const found = await prisma.fundingRequest.findFirst({
          where: { clubId: club.id, idempotencyKey: maybeIdempotencyKey },
        });
        if (found) return NextResponse.json({ request: found }, { status: 200 });
      }
      throw err;
    }
  }

  const fundingRequest = await prisma.fundingRequest.create({
    data: {
      clubId: club.id,
      amount,
      status: "PENDING",
      answers: answers as unknown as object,
      schemaSnapshot: fields as unknown as object,
    },
  });

  return NextResponse.json({ request: fundingRequest }, { status: 201 });
}
