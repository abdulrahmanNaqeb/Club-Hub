import * as React from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AppDialogProps {
  trigger?: React.ReactNode
  title: string
  description?: string
  footer?: React.ReactNode
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AppDialog({
  trigger,
  title,
  description,
  footer,
  children,
  open,
  onOpenChange,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent className="rounded-3xl bg-elevated text-copy-primary">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-copy-secondary">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
        {footer && (
          <DialogFooter className="bg-transparent">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { DialogClose as AppDialogClose }
