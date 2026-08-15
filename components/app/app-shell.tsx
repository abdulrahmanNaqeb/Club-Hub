import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { AppShellProvider } from "@/components/app/app-shell-context";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppNavbar } from "@/components/app/app-navbar";

interface AppShellProps {
  mode: "union" | "club";
  title: string;
  children: ReactNode;
  // Full-bleed surfaces (Events board, Brainstorm canvas per ui-context.md)
  // opt out of the standard dashboard padding.
  padded?: boolean;
}

export function AppShell({ mode, title, children, padded = true }: AppShellProps) {
  return (
    <AppShellProvider>
      <div className="flex h-screen bg-page">
        <AppSidebar mode={mode} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppNavbar title={title} />

          <main className={cn("flex-1 overflow-y-auto", padded && "p-6")}>{children}</main>
        </div>
      </div>
    </AppShellProvider>
  );
}
