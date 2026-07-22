import { requireOrgMode } from "@/lib/get-org-mode";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function UnionFundingPage() {
  await requireOrgMode("union");

  return (
    <AppShell mode="union" title="Funding">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Funding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-copy-secondary">
            Funding requests will live here.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
