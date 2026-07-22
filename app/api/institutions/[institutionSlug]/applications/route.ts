import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

import { getInstitutionBySlug } from "@/lib/institution-scope";
import {
  getOrSeedFormSchema,
  PROPOSED_ADMIN_EMAIL_FIELD_KEY,
  type FormField,
} from "@/lib/form-schema-defaults";
import { validateFormAnswers, type FormAnswers } from "@/lib/validate-form-answers";
import { prisma } from "@/lib/prisma";

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

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/institutions/[institutionSlug]/applications">
) {
  const { institutionSlug } = await ctx.params;

  const institution = await getInstitutionBySlug(institutionSlug);
  if (!institution) {
    return NextResponse.json({ error: "Institution not found." }, { status: 404 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json();
  const rawAnswers = parseAnswers(body);
  if (!rawAnswers) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const schema = await getOrSeedFormSchema(institution, "CLUB_APPLICATION");
  const fields = schema.fields as unknown as FormField[];

  const errors = validateFormAnswers(fields, rawAnswers);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Validation failed.", fieldErrors: errors }, { status: 400 });
  }

  const answers = pickAnswers(fields, rawAnswers);

  const reservedField = fields.find(
    (field) => field.fieldKey === PROPOSED_ADMIN_EMAIL_FIELD_KEY
  );

  let proposedAdminEmail: string | undefined;
  if (reservedField && typeof answers[PROPOSED_ADMIN_EMAIL_FIELD_KEY] === "string") {
    proposedAdminEmail = answers[PROPOSED_ADMIN_EMAIL_FIELD_KEY] as string;
  } else {
    const user = await currentUser();
    proposedAdminEmail = user?.primaryEmailAddress?.emailAddress;
    console.warn(
      `ClubApplication submission for institution ${institution.id} is missing the reserved "${PROPOSED_ADMIN_EMAIL_FIELD_KEY}" field — falling back to submitter's own email.`
    );
  }

  if (!proposedAdminEmail) {
    return NextResponse.json(
      { error: "Could not determine a proposed admin email." },
      { status: 400 }
    );
  }

  const application = await prisma.clubApplication.create({
    data: {
      institutionId: institution.id,
      status: "PENDING",
      answers: answers as unknown as object,
      schemaSnapshot: fields as unknown as object,
      proposedAdminUserId: userId,
      proposedAdminEmail,
    },
  });

  return NextResponse.json({ application }, { status: 201 });
}
