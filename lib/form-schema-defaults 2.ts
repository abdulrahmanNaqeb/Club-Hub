import type { FormType, Institution } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type FieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "BOOLEAN"
  | "SELECT"
  | "DATE"
  | "FILE";

export interface FormField {
  fieldKey: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  helpText?: string;
}

const CLUB_APPLICATION_DEFAULTS: FormField[] = [
  { fieldKey: "club_name", label: "Club name", type: "TEXT", required: true },
  {
    fieldKey: "description",
    label: "Description",
    type: "TEXTAREA",
    required: true,
  },
  {
    fieldKey: "category",
    label: "Category",
    type: "SELECT",
    required: true,
    options: ["Academic", "Cultural", "Sports", "Service", "Other"],
  },
  {
    fieldKey: "proposed_admin_name",
    label: "Proposed admin name",
    type: "TEXT",
    required: true,
  },
  {
    fieldKey: "proposed_admin_email",
    label: "Proposed admin email",
    type: "TEXT",
    required: true,
  },
  {
    fieldKey: "expected_member_count",
    label: "Expected member count",
    type: "NUMBER",
    required: true,
  },
];

const EVENT_APPROVAL_DEFAULTS: FormField[] = [
  { fieldKey: "event_name", label: "Event name", type: "TEXT", required: true },
  { fieldKey: "date", label: "Date", type: "DATE", required: true },
  { fieldKey: "location", label: "Location", type: "TEXT", required: true },
  {
    fieldKey: "description",
    label: "Description",
    type: "TEXTAREA",
    required: true,
  },
  {
    fieldKey: "has_presentation",
    label: "Will there be a presentation",
    type: "BOOLEAN",
    required: true,
  },
  {
    fieldKey: "speaker_names",
    label: "Speaker name(s)",
    type: "TEXT",
    required: false,
  },
  {
    fieldKey: "has_physical_activities",
    label: "Are there physical activities",
    type: "BOOLEAN",
    required: true,
  },
];

const FUNDING_REQUEST_DEFAULTS: FormField[] = [
  { fieldKey: "amount", label: "Amount", type: "NUMBER", required: true },
  { fieldKey: "reason", label: "Reason", type: "TEXTAREA", required: true },
];

export const FORM_TYPES: FormType[] = [
  "CLUB_APPLICATION",
  "EVENT_APPROVAL",
  "FUNDING_REQUEST",
];

export function isFormType(value: string): value is FormType {
  return (FORM_TYPES as string[]).includes(value);
}

export function getDefaultFields(formType: FormType): FormField[] {
  switch (formType) {
    case "CLUB_APPLICATION":
      return CLUB_APPLICATION_DEFAULTS;
    case "EVENT_APPROVAL":
      return EVENT_APPROVAL_DEFAULTS;
    case "FUNDING_REQUEST":
      return FUNDING_REQUEST_DEFAULTS;
  }
}

export async function getOrSeedFormSchema(
  institution: Institution,
  formType: FormType
) {
  const existing = await prisma.formSchema.findUnique({
    where: { institutionId_formType: { institutionId: institution.id, formType } },
  });

  if (existing) {
    return existing;
  }

  return prisma.formSchema.create({
    data: {
      institutionId: institution.id,
      formType,
      fields: getDefaultFields(formType) as unknown as object,
    },
  });
}
