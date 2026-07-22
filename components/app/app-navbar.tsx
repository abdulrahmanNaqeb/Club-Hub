"use client"

import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAppShell } from "@/components/app/app-shell-context"

interface AppNavbarProps {
  title: string
}

export function AppNavbar({ title }: AppNavbarProps) {
  const { toggleSidebar } = useAppShell()

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-surface-border bg-surface px-4">
      <div className="flex flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-3xl font-semibold text-copy-primary">
          {title}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center" />

      <div className="flex flex-1 items-center justify-end" />
    </header>
  )
}
