"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FormField } from "@/lib/form-schema-defaults"
import type { FormAnswers } from "@/lib/validate-form-answers"

interface DynamicFormProps {
  fields: FormField[]
  answers: FormAnswers
  onChange: (fieldKey: string, value: unknown) => void
  errors?: Record<string, string>
}

export function DynamicForm({
  fields,
  answers,
  onChange,
  errors = {},
}: DynamicFormProps) {
  return (
    <div className="flex flex-col gap-5">
      {fields.map((field) => (
        <div key={field.fieldKey} className="flex flex-col gap-1.5">
          <Label htmlFor={`field-${field.fieldKey}`}>
            {field.label}
            {field.required && <span className="text-error"> *</span>}
          </Label>

          <DynamicFormInput
            field={field}
            value={answers[field.fieldKey]}
            onChange={(value) => onChange(field.fieldKey, value)}
          />

          {field.helpText && (
            <p className="text-sm text-copy-secondary">{field.helpText}</p>
          )}
          {errors[field.fieldKey] && (
            <p className="text-sm text-error">{errors[field.fieldKey]}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function DynamicFormInput({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
}) {
  const inputId = `field-${field.fieldKey}`

  switch (field.type) {
    case "TEXT":
      return (
        <Input
          id={inputId}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    case "TEXTAREA":
      return (
        <Textarea
          id={inputId}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    case "NUMBER":
      return (
        <Input
          id={inputId}
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(event) =>
            onChange(
              event.target.value === "" ? undefined : Number(event.target.value)
            )
          }
        />
      )
    case "DATE":
      return (
        <Input
          id={inputId}
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )
    case "BOOLEAN":
      return (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={value === true ? "default" : "outline"}
            onClick={() => onChange(true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={value === false ? "default" : "outline"}
            onClick={() => onChange(false)}
          >
            No
          </Button>
        </div>
      )
    case "SELECT":
      return (
        <Select
          value={typeof value === "string" ? value : undefined}
          onValueChange={onChange}
        >
          <SelectTrigger id={inputId} className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case "FILE":
      return (
        <Input id={inputId} disabled placeholder="File uploads coming soon" />
      )
  }
}
