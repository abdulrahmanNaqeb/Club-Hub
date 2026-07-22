"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FieldEditorDialog } from "@/components/union/field-editor-dialog"
import type { FormField } from "@/lib/form-schema-defaults"
import type { FormType } from "@/generated/prisma/client"

const FIELD_TYPE_LABELS: Record<FormField["type"], string> = {
  TEXT: "Short text",
  TEXTAREA: "Long text",
  NUMBER: "Number",
  BOOLEAN: "Yes/No",
  SELECT: "Single select",
  DATE: "Date",
  FILE: "File upload",
}

interface FormSchemaBuilderProps {
  tabs: { formType: FormType; label: string }[]
  initialSchemas: { formType: FormType; fields: FormField[] }[]
}

type SaveState = "idle" | "saving" | "saved" | "error"

function FormTypeEditor({
  formType,
  initialFields,
}: {
  formType: FormType
  initialFields: FormField[]
}) {
  const [fields, setFields] = useState<FormField[]>(initialFields)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [saveState, setSaveState] = useState<SaveState>("idle")

  function openAddDialog() {
    setEditingField(null)
    setDialogOpen(true)
  }

  function openEditDialog(field: FormField) {
    setEditingField(field)
    setDialogOpen(true)
  }

  function handleSaveField(field: FormField) {
    setFields((current) => {
      const index = current.findIndex((f) => f.fieldKey === field.fieldKey)
      if (index === -1) {
        return [...current, field]
      }
      const next = [...current]
      next[index] = field
      return next
    })
  }

  function handleDelete(fieldKey: string) {
    setFields((current) => current.filter((f) => f.fieldKey !== fieldKey))
  }

  function moveField(index: number, direction: -1 | 1) {
    setFields((current) => {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= current.length) return current
      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  async function handleSaveChanges() {
    setSaveState("saving")
    try {
      const response = await fetch(`/api/union/forms/${formType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      })
      if (!response.ok) throw new Error("Save failed")
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch {
      setSaveState("error")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fields</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {fields.length === 0 && (
          <p className="text-sm text-copy-secondary">
            No fields yet — add one to get started.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div
              key={field.fieldKey}
              className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface px-3 py-2"
            >
              <button
                type="button"
                onClick={() => openEditDialog(field)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <span className="truncate text-sm font-medium text-copy-primary">
                  {field.label}
                </span>
                <Badge variant="outline">
                  {FIELD_TYPE_LABELS[field.type]}
                </Badge>
                {field.required && <Badge variant="secondary">Required</Badge>}
              </button>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() => moveField(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move down"
                  disabled={index === fields.length - 1}
                  onClick={() => moveField(index, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit field"
                  onClick={() => openEditDialog(field)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  aria-label="Delete field"
                  onClick={() => handleDelete(field.fieldKey)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={openAddDialog}>
            <Plus />
            Add field
          </Button>

          <div className="flex items-center gap-2">
            {saveState === "saved" && (
              <span className="text-sm text-copy-secondary">Saved</span>
            )}
            {saveState === "error" && (
              <span className="text-sm text-error">Failed to save</span>
            )}
            <Button
              onClick={handleSaveChanges}
              disabled={saveState === "saving"}
            >
              {saveState === "saving" ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </CardContent>

      <FieldEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        field={editingField}
        existingKeys={fields.map((f) => f.fieldKey)}
        onSave={handleSaveField}
      />
    </Card>
  )
}

export function FormSchemaBuilder({
  tabs,
  initialSchemas,
}: FormSchemaBuilderProps) {
  return (
    <Tabs defaultValue={tabs[0]?.formType}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.formType} value={tab.formType}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => {
        const schema = initialSchemas.find((s) => s.formType === tab.formType)
        return (
          <TabsContent key={tab.formType} value={tab.formType} className="mt-4">
            <FormTypeEditor
              formType={tab.formType}
              initialFields={schema?.fields ?? []}
            />
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
