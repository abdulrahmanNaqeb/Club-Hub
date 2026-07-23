"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { DynamicForm } from "@/components/forms/dynamic-form"
import { Button } from "@/components/ui/button"
import { validateFormAnswers, type FormAnswers } from "@/lib/validate-form-answers"
import type { FormField } from "@/lib/form-schema-defaults"

interface RequestFundingFormProps {
  fields: FormField[]
}

export function RequestFundingForm({ fields }: RequestFundingFormProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<FormAnswers>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function handleChange(fieldKey: string, value: unknown) {
    setAnswers((current) => ({ ...current, [fieldKey]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitError(null)

    const validationErrors = validateFormAnswers(fields, answers)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/budget/request-funding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        if (body?.fieldErrors) {
          setErrors(body.fieldErrors)
        }
        setSubmitError(body?.error ?? "Something went wrong. Please try again.")
        return
      }

      router.push("/budget/request-funding/confirmation")
    } catch {
      setSubmitError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <DynamicForm fields={fields} answers={answers} onChange={handleChange} errors={errors} />

      {submitError && <p className="text-sm text-error">{submitError}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  )
}
