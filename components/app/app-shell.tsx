import type { ReactNode } from "react";

import { AppShellProvider } from "@/components/app/app-shell-context";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppNavbar } from "@/components/app/app-navbar";

interface AppShellProps {
  mode: "union" | "club";
  title: string;
  children: ReactNode;
}

export function AppShell({ mode, title, children }: AppShellProps) {
  return (
    <AppShellProvider>
      <div className="flex h-screen bg-page">
        <AppSidebar mode={mode} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppNavbar title={title} />

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AppShellProvider>
  );
}
