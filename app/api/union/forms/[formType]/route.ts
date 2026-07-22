import { NextResponse } from "next/server";

import { getActiveInstitution } from "@/lib/institution-scope";
import { prisma } from "@/lib/prisma";
import {
  getOrSeedFormSchema,
  isFormType,
  type FieldType,
  type FormField,
} from "@/lib/form-schema-defaults";

const FIELD_TYPES: FieldType[] = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "BOOLEAN",
  "SELECT",
  "DATE",
  "FILE",
];

async function resolveInstitutionOrError() {
  try {
    return { institution: await getActiveInstitution() };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Not authorized for this institution." },
        { status: 403 }
      ),
    };
  }
}

function parseFields(body: unknown): FormField[] | null {
  if (!body || typeof body !== "object" || !("fields" in body)) {
    return null;
  }

  const { fields } = body as { fields: unknown };
  if (!Array.isArray(fields)) {
    return null;
  }

  const parsed: FormField[] = [];

  for (const raw of fields) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const field = raw as Record<string, unknown>;

    if (
      typeof field.fieldKey !== "string" ||
      typeof field.label !== "string" ||
      typeof field.type !== "string" ||
      !FIELD_TYPES.includes(field.type as FieldType) ||
      typeof field.required !== "boolean"
    ) {
      return null;
    }

    if (field.options !== undefined) {
      if (
        !Array.isArray(field.options) ||
        !field.options.every((option) => typeof option === "string")
      ) {
        return null;
      }
    }

    if (field.helpText !== undefined && typeof field.helpText !== "string") {
      return null;
    }

    parsed.push({
      fieldKey: field.fieldKey,
      label: field.label,
      type: field.type as FieldType,
      required: field.required,
      options: field.options as string[] | undefined,
      helpText: field.helpText as string | undefined,
    });
  }

  return parsed;
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/union/forms/[formType]">
) {
  const { formType } = await ctx.params;

  if (!isFormType(formType)) {
    return NextResponse.json({ error: "Invalid form type." }, { status: 400 });
  }

  const { institution, error } = await resolveInstitutionOrError();
  if (error) {
    return error;
  }

  const schema = await getOrSeedFormSchema(institution, formType);

  return NextResponse.json({ schema });
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/union/forms/[formType]">
) {
  const { formType } = await ctx.params;

  if (!isFormType(formType)) {
    return NextResponse.json({ error: "Invalid form type." }, { status: 400 });
  }

  const { institution, error } = await resolveInstitutionOrError();
  if (error) {
    return error;
  }

  const body = await request.json();
  const fields = parseFields(body);

  if (!fields) {
    return NextResponse.json(
      { error: "Invalid field list." },
      { status: 400 }
    );
  }

  const schema = await prisma.formSchema.upsert({
    where: {
      institutionId_formType: { institutionId: institution.id, formType },
    },
    update: { fields: fields as unknown as object },
    create: {
      institutionId: institution.id,
      formType,
      fields: fields as unknown as object,
    },
  });

  return NextResponse.json({ schema });
}
