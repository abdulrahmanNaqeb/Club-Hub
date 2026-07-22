"use client"

import { useState } from "react"

import { AppShellProvider } from "@/components/app/app-shell-context"
import { AppSidebar } from "@/components/app/app-sidebar"
import { AppNavbar } from "@/components/app/app-navbar"
import { AppDialog } from "@/components/app/app-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppShellProvider>
      <div className="flex h-screen bg-page">
        <AppSidebar mode="club" />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppNavbar title="Team" />

          <main className="flex-1 overflow-y-auto p-6">
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle>App Chrome Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-copy-secondary">
                  This is the main content area, framed by the persistent
                  sidebar and top navbar. Resize the window to see the
                  sidebar collapse behind the hamburger toggle on small
                  screens.
                </p>
                <Button
                  className="w-fit"
                  onClick={() => setDialogOpen(true)}
                >
                  Open example dialog
                </Button>
              </CardContent>
            </Card>

            <AppDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              title="Example dialog"
              description="This demonstrates the shared dialog pattern — title, description, and footer actions — ready for future use."
              footer={
                <>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>
                    Confirm
                  </Button>
                </>
              }
            >
              <p className="text-sm text-copy-secondary">
                Body content goes here.
              </p>
            </AppDialog>
          </main>
        </div>
      </div>
    </AppShellProvider>
  );
}
