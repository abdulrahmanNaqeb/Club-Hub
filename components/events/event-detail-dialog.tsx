"use client"

import { useState, type ReactNode } from "react"
import { Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { EVENT_STATUS_LABELS } from "@/components/events/board-types"
import type { BoardEvent, ClubMember, EventTask } from "@/components/events/board-types"

const UNASSIGNED = "__unassigned__"

interface EventDetailDialogProps {
  event: BoardEvent | null
  members: ClubMember[]
  onOpenChange: (open: boolean) => void
  onEventUpdated: (event: BoardEvent) => void
}

// Extends the read-only summary this used to be (14-events-board.md) into
// the real editable panel + checklist from 16-event-detail-checklist.md.
// No linked-budget section yet — that's 17-budget-categories-entries.md,
// per this spec's own Scope Note.
export function EventDetailDialog({ event, members, onOpenChange, onEventUpdated }: EventDetailDialogProps) {
  return (
    <Dialog open={event !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl bg-elevated text-copy-primary sm:max-w-lg">
        {event && (
          // Keyed by event.id so opening a different event mounts a fresh
          // instance instead of needing a useEffect to reset local state —
          // same anti-pattern-avoidance already used for 09/10/11's queue dialogs.
          <EventDetailContent key={event.id} event={event} members={members} onUpdated={onEventUpdated} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null
  return new Date(value).toISOString()
}

interface EventDetailContentProps {
  event: BoardEvent
  members: ClubMember[]
  onUpdated: (event: BoardEvent) => void
}

function EventDetailContent({ event, members, onUpdated }: EventDetailContentProps) {
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description ?? "")
  const [location, setLocation] = useState(event.location ?? "")
  const [dateTimeLocal, setDateTimeLocal] = useState(toDatetimeLocalValue(event.dateTime))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [tasks, setTasks] = useState<EventTask[]>(event.tasks)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [taskError, setTaskError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description.trim() === "" ? null : description,
          location: location.trim() === "" ? null : location,
          dateTime: fromDatetimeLocalValue(dateTimeLocal),
        }),
      })
      if (!res.ok) throw new Error("Request failed")
      const { event: updated } = await res.json()
      onUpdated({ ...event, ...updated, tasks })
    } catch {
      setSaveError("Couldn't save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddTask() {
    const trimmed = newTaskTitle.trim()
    if (!trimmed) return
    setTaskError(null)
    try {
      const res = await fetch(`/api/events/${event.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!res.ok) throw new Error("Request failed")
      const { task } = await res.json()
      setTasks((prev) => [...prev, task])
      setNewTaskTitle("")
    } catch {
      setTaskError("Couldn't add that task. Please try again.")
    }
  }

  async function patchTask(taskId: string, data: Partial<Pick<EventTask, "title" | "done" | "assignee">>) {
    const previous = tasks
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...data } : t)))
    setTaskError(null)
    try {
      const res = await fetch(`/api/events/${event.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Request failed")
    } catch {
      setTasks(previous)
      setTaskError("Couldn't update that task. Please try again.")
    }
  }

  async function deleteTask(taskId: string) {
    const previous = tasks
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setTaskError(null)
    try {
      const res = await fetch(`/api/events/${event.id}/tasks/${taskId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Request failed")
    } catch {
      setTasks(previous)
      setTaskError("Couldn't delete that task. Please try again.")
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-copy-primary">Edit event</DialogTitle>
        <DialogDescription className="text-copy-secondary">
          {EVENT_STATUS_LABELS[event.status]}
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        <div className="space-y-3">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </Field>
          <Field label="Location">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Date & time">
            <Input
              type="datetime-local"
              value={dateTimeLocal}
              onChange={(e) => setDateTimeLocal(e.target.value)}
            />
          </Field>
          {saveError && <p className="text-xs text-error">{saveError}</p>}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div className="border-t border-surface-border pt-4">
          <h3 className="text-sm font-semibold text-copy-primary">Checklist</h3>
          {taskError && <p className="mt-1 text-xs text-error">{taskError}</p>}

          <div className="mt-2 space-y-1">
            {tasks.length === 0 && <p className="text-xs text-copy-faint">No tasks yet.</p>}
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                members={members}
                onToggleDone={(done) => patchTask(task.id, { done })}
                onRename={(newTitle) => patchTask(task.id, { title: newTitle })}
                onAssign={(assignee) => patchTask(task.id, { assignee })}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Add a task…"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddTask()
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={handleAddTask}>
              Add task
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-copy-muted">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

interface TaskRowProps {
  task: EventTask
  members: ClubMember[]
  onToggleDone: (done: boolean) => void
  onRename: (title: string) => void
  onAssign: (assignee: string | null) => void
  onDelete: () => void
}

function TaskRow({ task, members, onToggleDone, onRename, onAssign, onDelete }: TaskRowProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState(task.title)

  // Passed explicitly (rather than relying on <SelectItem> registration) so
  // an already-assigned task shows the member's real name immediately —
  // without this, Base UI's Select.Value can't resolve a label for a value
  // whose popup content has never been mounted/opened yet, and falls back
  // to rendering the raw Clerk user id.
  const selectItems = [
    { value: UNASSIGNED, label: "Unassigned" },
    ...members.map((member) => ({ value: member.id, label: member.name })),
  ]

  function commitRename() {
    setIsEditingTitle(false)
    const trimmed = draftTitle.trim()
    if (trimmed && trimmed !== task.title) onRename(trimmed)
    else setDraftTitle(task.title)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-surface">
      <input
        type="checkbox"
        checked={task.done}
        onChange={(e) => onToggleDone(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-surface-border accent-brand"
      />

      {isEditingTitle ? (
        <Input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commitRename()
            }
            if (e.key === "Escape") {
              setDraftTitle(task.title)
              setIsEditingTitle(false)
            }
          }}
          className="h-7 flex-1"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsEditingTitle(true)}
          className={cn(
            "flex-1 truncate text-left text-sm text-copy-primary",
            task.done && "text-copy-muted line-through"
          )}
        >
          {task.title}
        </button>
      )}

      <Select
        items={selectItems}
        value={task.assignee ?? UNASSIGNED}
        onValueChange={(value) => onAssign(value === UNASSIGNED ? null : value)}
      >
        <SelectTrigger size="sm" className="w-36 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="ghost" size="icon-sm" aria-label="Delete task" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
