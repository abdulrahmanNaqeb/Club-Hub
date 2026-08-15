import { requireOrgMode } from "@/lib/get-org-mode";
import { getOrSeedFormSchema, type FormField } from "@/lib/form-schema-defaults";
import { AppShell } from "@/components/app/app-shell";
import { FormSchemaBuilder } from "@/components/union/form-schema-builder";
import type { FormType } from "@/generated/prisma/client";

const FORM_TABS: { formType: FormType; label: string }[] = [
  { formType: "CLUB_APPLICATION", label: "Club Application" },
  { formType: "EVENT_APPROVAL", label: "Event Approval" },
  { formType: "FUNDING_REQUEST", label: "Funding Request" },
];

export default async function UnionFormsPage() {
  const institution = await requireOrgMode("union");

  const schemas = await Promise.all(
    FORM_TABS.map((tab) => getOrSeedFormSchema(institution, tab.formType))
  );

  return (
    <AppShell mode="union" title="Forms">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 font-heading text-xl font-medium text-copy-primary">
          Form Builder
        </h1>
        <p className="mb-6 text-sm text-copy-secondary">
          Define the fields your club application, event approval, and
          funding request forms collect.
        </p>

        <FormSchemaBuilder
          tabs={FORM_TABS}
          initialSchemas={schemas.map((schema) => ({
            formType: schema.formType,
            fields: schema.fields as unknown as FormField[],
          }))}
        />
      </div>
    </AppShell>
  );
}
