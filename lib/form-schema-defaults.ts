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

// Reserved: CLUB_APPLICATION schemas must always carry a field with this
// fieldKey. If a union edits the schema and removes it, submission falls
// back to the submitter's own Clerk email rather than blocking (see
// lib/get-proposed-admin-email.ts).
export const PROPOSED_ADMIN_EMAIL_FIELD_KEY = "proposedAdminEmail";

// Reserved: the club application queue reads this key out of `answers` to
// show a club name in the list without joining back to the schema, and the
// approve route uses the same value to set both the new Clerk org's name
// and Club.name (one source of truth for the club's display name at
// creation time). This is a required field that must always be present in
// CLUB_APPLICATION schemas. If a union deletes this field, the approval
// flow will fail when attempting to create the Club (no fallback to
// placeholder labels).
export const CLUB_NAME_FIELD_KEY = "club_name";

// Reserved: event approval requires a title for the Event it creates on
// approval. This is a required field that must always be present in
// EVENT_APPROVAL schemas. Unlike CLUB_NAME_FIELD_KEY with a fallback admin
// email, there is no alternative source of truth for an event title. If a
// union deletes this field, the approval flow will fail when attempting to
// set Event.title (no fallback to placeholder title).
export const EVENT_NAME_FIELD_KEY = "eventName";

const CLUB_APPLICATION_DEFAULTS: FormField[] = [
  { fieldKey: CLUB_NAME_FIELD_KEY, label: "Club name", type: "TEXT", required: true },
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
    fieldKey: PROPOSED_ADMIN_EMAIL_FIELD_KEY,
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
  { fieldKey: EVENT_NAME_FIELD_KEY, label: "Event name", type: "TEXT", required: true },
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

// Reserved: funding requests store the requested amount as its own Decimal
// column (`FundingRequest.amount`), pulled from this key rather than living
// only inside `answers`/`schemaSnapshot`, so approval can add it straight to
// Club.baselineBudgetAmount without re-parsing form answers. This is a
// required field that must always be present in FUNDING_REQUEST schemas.
// Unlike CLUB_NAME_FIELD_KEY, there is no fallback — if a union deletes this
// field, submission fails outright rather than guessing an amount.
export const FUNDING_AMOUNT_FIELD_KEY = "amount";

const FUNDING_REQUEST_DEFAULTS: FormField[] = [
  { fieldKey: FUNDING_AMOUNT_FIELD_KEY, label: "Amount", type: "NUMBER", required: true },
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
  const defaultFields = getDefaultFields(formType);

  // Ensure a schema exists (create if missing)
  const schema = await prisma.formSchema.upsert({
    where: { institutionId_formType: { institutionId: institution.id, formType } },
    create: {
      institutionId: institution.id,
      formType,
      fields: defaultFields as unknown as object,
    },
    update: {},
  });

  // Normalize only the reserved keys in existing schemas. This preserves
  // any custom fields a union added while ensuring required reserved
  // fields (and their types) are present and valid.
  const fields = schema.fields as unknown as FormField[];
  let changed = false;

  // Helper to ensure a default field exists with required type/required flag
  function ensureReserved(def: FormField) {
    const idx = fields.findIndex((f) => f.fieldKey === def.fieldKey);
    if (idx === -1) {
      // missing -> insert at the front to keep defaults discoverable
      fields.unshift(def);
      changed = true;
      return;
    }

    const existing = fields[idx];
    // If the reserved key exists but the type/required don't match the
    // canonical defaults, normalize them.
    if (existing.type !== def.type || existing.required !== def.required) {
      fields[idx] = { ...existing, type: def.type, required: def.required, label: def.label };
      changed = true;
    }
  }

  for (const def of defaultFields) {
    // Only normalize the reserved fields we care about. For FUNDING_REQUEST
    // we need to ensure `amount` is NUMBER and required.
    if (formType === "FUNDING_REQUEST") {
      if (def.fieldKey === FUNDING_AMOUNT_FIELD_KEY) ensureReserved(def);
      continue;
    }

    if (formType === "CLUB_APPLICATION") {
      if (def.fieldKey === CLUB_NAME_FIELD_KEY) ensureReserved(def);
      continue;
    }

    if (formType === "EVENT_APPROVAL") {
      if (def.fieldKey !== EVENT_NAME_FIELD_KEY) {
        continue;
      }

      const legacyFieldKey = "event_name"
      const legacyIndex = fields.findIndex((f) => f.fieldKey === legacyFieldKey)
      const canonicalIndex = fields.findIndex((f) => f.fieldKey === EVENT_NAME_FIELD_KEY)

      if (legacyIndex !== -1) {
        if (canonicalIndex === -1) {
          const legacy = fields[legacyIndex]
          fields[legacyIndex] = {
            ...legacy,
            fieldKey: EVENT_NAME_FIELD_KEY,
            type: def.type,
            required: def.required,
            label: def.label,
          }
          changed = true
        } else {
          fields.splice(legacyIndex, 1)
          changed = true
        }
      }

      ensureReserved(def)
      continue;
    }
  }

  if (changed) {
    const updated = await prisma.formSchema.update({
      where: { id: schema.id },
      data: { fields: fields as unknown as object },
    });
    return updated;
  }

  return schema;
}
