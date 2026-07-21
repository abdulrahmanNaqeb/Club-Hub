"use client"

import * as React from "react"

interface AppShellContextValue {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const AppShellContext = React.createContext<AppShellContextValue | null>(null)

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const toggleSidebar = React.useCallback(() => {
    setSidebarOpen((open) => !open)
  }, [])

  return (
    <AppShellContext.Provider
      value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}
    >
      {children}
    </AppShellContext.Provider>
  )
}

export function useAppShell() {
  const context = React.useContext(AppShellContext)
  if (!context) {
    throw new Error("useAppShell must be used within an AppShellProvider")
  }
  return context
}
