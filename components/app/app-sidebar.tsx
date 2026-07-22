"use client"

import Link from "next/link"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import {
  LayoutGrid,
  Users,
  CalendarDays,
  ClipboardList,
  Landmark,
  FileText,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useAppShell } from "@/components/app/app-shell-context"

interface NavItem {
  label: string
  icon: LucideIcon
  href?: string
  disabled?: boolean
}

const CLUB_NAV_ITEMS: NavItem[] = [
  { label: "Team", icon: Users, href: "/team" },
  { label: "Events", icon: CalendarDays, disabled: true },
  { label: "More", icon: LayoutGrid, disabled: true },
]

const UNION_NAV_ITEMS: NavItem[] = [
  { label: "Applications", icon: ClipboardList, href: "/union/applications" },
  { label: "Events", icon: CalendarDays, href: "/union/events" },
  { label: "Funding", icon: Landmark, href: "/union/funding" },
  { label: "Forms", icon: FileText, href: "/union/forms" },
]

interface AppSidebarProps {
  mode: "union" | "club"
}

export function AppSidebar({ mode }: AppSidebarProps) {
  const { sidebarOpen } = useAppShell()
  const navItems = mode === "union" ? UNION_NAV_ITEMS : CLUB_NAV_ITEMS

  return (
    <aside
      data-open={sidebarOpen}
      className={cn(
        "z-40 flex w-64 shrink-0 flex-col border-r border-surface-border bg-surface",
        "fixed inset-y-0 left-0 -translate-x-full transition-transform data-[open=true]:translate-x-0",
        "md:static md:translate-x-0"
      )}
    >
      <div className="flex items-center gap-2 p-3 pb-2">
        <Badge variant="outline">{mode === "union" ? "Union" : "Club"}</Badge>
      </div>

      <div className="px-3 pb-3">
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
        {navItems.map(({ label, icon: Icon, href, disabled }) => {
          const activeClassName =
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary"

          const disabledClassName =
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-copy-secondary opacity-60 cursor-not-allowed"

          if (href) {
            return (
              <Link key={label} href={href} className={activeClassName}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          }

          if (disabled) {
            return (
              <span
                key={label}
                role="link"
                aria-disabled="true"
                tabIndex={-1}
                className={disabledClassName}
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
            )
          }

          return (
            <button key={label} type="button" className={activeClassName}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          )
        })}
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
