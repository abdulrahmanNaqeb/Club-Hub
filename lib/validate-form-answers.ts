import type { FormField } from "@/lib/form-schema-defaults";

export type FormAnswers = Record<string, unknown>;

function isBlank(value: unknown) {
  return value === undefined || value === null || value === "";
}

/**
 * Validates answers against a schema's fields. Shared between the client
 * (pre-submit UX) and the API route (source of truth) so the two never
 * drift. Returns a map of fieldKey -> error message; empty means valid.
 * FILE fields are never validated — file uploads aren't collected yet.
 */
export function validateFormAnswers(
  fields: FormField[],
  answers: FormAnswers
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (field.type === "FILE") continue;

    const value = answers[field.fieldKey];

    if (field.required && isBlank(value)) {
      errors[field.fieldKey] = "This field is required.";
      continue;
    }

    if (isBlank(value)) continue;

    switch (field.type) {
      case "NUMBER":
        if (typeof value !== "number" || Number.isNaN(value)) {
          errors[field.fieldKey] = "Enter a valid number.";
        }
        break;
      case "BOOLEAN":
        if (typeof value !== "boolean") {
          errors[field.fieldKey] = "Choose an option.";
        }
        break;
      case "SELECT":
        if (
          typeof value !== "string" ||
          (field.options && !field.options.includes(value))
        ) {
          errors[field.fieldKey] = "Choose an option.";
        }
        break;
      case "TEXT":
      case "TEXTAREA":
      case "DATE":
        if (typeof value !== "string") {
          errors[field.fieldKey] = "Invalid value.";
        }
        break;
    }
  }

  return errors;
}
