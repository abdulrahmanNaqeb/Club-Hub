import { requireOrgMode } from "@/lib/get-org-mode";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UnionEventsPage() {
  await requireOrgMode("union");

  return (
    <AppShell mode="union" title="Events">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-copy-secondary">
            Event approval requests will live here.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
