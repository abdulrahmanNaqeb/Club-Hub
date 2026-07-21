"use client"

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { LayoutGrid, Users, CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAppShell } from "@/components/app/app-shell-context"

const NAV_ITEMS = [
  { label: "Team", icon: Users },
  { label: "Events", icon: CalendarDays },
  { label: "More", icon: LayoutGrid },
] as const

export function AppSidebar() {
  const { sidebarOpen } = useAppShell()

  return (
    <aside
      data-open={sidebarOpen}
      className={cn(
        "z-40 flex w-64 shrink-0 flex-col border-r border-surface-border bg-surface",
        "fixed inset-y-0 left-0 -translate-x-full transition-transform data-[open=true]:translate-x-0",
        "md:static md:translate-x-0"
      )}
    >
      <div className="p-3">
        <OrganizationSwitcher
          afterCreateOrganizationUrl="/team"
          afterSelectOrganizationUrl="/team"
          afterLeaveOrganizationUrl="/select-club"
          hidePersonal
          appearance={{
            elements: {
              rootBox: "w-full",
              organizationSwitcherTrigger:
                "w-full justify-between rounded-xl border border-surface-border bg-transparent px-3 py-2 text-copy-primary hover:bg-subtle",
            },
          }}
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary"
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t border-surface-border p-3">
        <UserButton
          showName
          appearance={{
            elements: {
              rootBox: "w-full",
              userButtonTrigger:
                "w-full justify-start rounded-xl px-2 py-2 hover:bg-subtle",
              userButtonBox: "flex-row-reverse gap-2.5",
              userButtonOuterIdentifier: "text-sm font-medium text-copy-primary",
            },
          }}
        />
      </div>
    </aside>
  )
}
