import { AppShellProvider } from "@/components/app/app-shell-context";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppNavbar } from "@/components/app/app-navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeamPage() {
  return (
    <AppShellProvider>
      <div className="flex h-screen bg-page">
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppNavbar title="Team" />

          <main className="flex-1 overflow-y-auto p-6">
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle>Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-copy-secondary">
                  Member list and roles will live here.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </AppShellProvider>
  );
}
