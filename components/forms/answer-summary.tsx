import type { FormField } from "@/lib/form-schema-defaults"
import type { FormAnswers } from "@/lib/validate-form-answers"

interface AnswerSummaryProps {
  fields: FormField[]
  answers: FormAnswers
}

export function AnswerSummary({ fields, answers }: AnswerSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <div key={field.fieldKey} className="flex flex-col gap-1">
          <span className="text-sm font-medium text-copy-secondary">
            {field.label}
          </span>
          <span className="text-sm whitespace-pre-wrap text-copy-primary">
            {formatAnswer(field, answers[field.fieldKey])}
          </span>
        </div>
      ))}
    </div>
  )
}

function formatAnswer(field: FormField, value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "—"
  }

  switch (field.type) {
    case "BOOLEAN":
      if (typeof value !== "boolean") return "—"
      return value ? "Yes" : "No"
    case "FILE":
      return typeof value === "string" && value ? value : "No file uploaded"
    case "NUMBER":
      return typeof value === "number" ? value.toLocaleString() : String(value)
    default:
      return String(value)
  }
}
