import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationSwitcher } from "@clerk/nextjs";

export default function OrgNotConfiguredPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-page p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>This organization isn&apos;t set up</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-copy-secondary">
            Your active organization isn&apos;t linked to a club or a union
            yet. Switch to a different organization, or contact support if
            you think this is a mistake.
          </p>
          <div className="mt-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
