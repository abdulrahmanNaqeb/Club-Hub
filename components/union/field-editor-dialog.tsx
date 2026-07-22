"use client"

import { useEffect, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FieldType, FormField } from "@/lib/form-schema-defaults"

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  TEXT: "Short text",
  TEXTAREA: "Long text",
  NUMBER: "Number",
  BOOLEAN: "Yes/No",
  SELECT: "Single select",
  DATE: "Date",
  FILE: "File upload",
}

const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as FieldType[]

function slugify(label: string) {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "field"
  )
}

interface FieldEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  field: FormField | null
  existingKeys: string[]
  onSave: (field: FormField) => void
}

const EMPTY_FIELD: FormField = {
  fieldKey: "",
  label: "",
  type: "TEXT",
  required: true,
  options: [],
  helpText: "",
};

export function FieldEditorDialog({
  open,
  onOpenChange,
  field,
  existingKeys,
  onSave,
}: FieldEditorDialogProps) {
  const [label, setLabel] = useState("")
  const [type, setType] = useState<FieldType>("TEXT")
  const [required, setRequired] = useState(true)
  const [optionsText, setOptionsText] = useState("")
  const [helpText, setHelpText] = useState("")

  useEffect(() => {
    if (!open) return
    const initial = field ?? EMPTY_FIELD
    setLabel(initial.label)
    setType(initial.type)
    setRequired(initial.required)
    setOptionsText((initial.options ?? []).join("\n"))
    setHelpText(initial.helpText ?? "")
  }, [open, field])

  const isValid = label.trim().length > 0

  function handleSave() {
    if (!isValid) return

    let fieldKey = field?.fieldKey ?? slugify(label)
    if (!field) {
      let candidate = fieldKey
      let suffix = 2
      while (existingKeys.includes(candidate)) {
        candidate = `${fieldKey}_${suffix}`
        suffix += 1
      }
      fieldKey = candidate
    }

    const options =
      type === "SELECT"
        ? optionsText
            .split("\n")
            .map((option) => option.trim())
            .filter(Boolean)
        : undefined

    onSave({
      fieldKey,
      label: label.trim(),
      type,
      required,
      options,
      helpText: helpText.trim() || undefined,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{field ? "Edit field" : "Add field"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. Club name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="field-type">Field type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as FieldType)}
            >
              <SelectTrigger id="field-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {FIELD_TYPE_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "SELECT" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="field-options">Options (one per line)</Label>
              <Textarea
                id="field-options"
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
                placeholder={"Academic\nCultural\nSports"}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="field-help-text">Help text (optional)</Label>
            <Input
              id="field-help-text"
              value={helpText}
              onChange={(event) => setHelpText(event.target.value)}
              placeholder="Shown beneath the field"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="field-required">Required</Label>
            <Switch
              id="field-required"
              checked={required}
              onCheckedChange={setRequired}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={!isValid}>
            {field ? "Save field" : "Add field"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
