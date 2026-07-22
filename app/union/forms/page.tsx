import { getActiveInstitution } from "@/lib/institution-scope";
import { getOrSeedFormSchema, type FormField } from "@/lib/form-schema-defaults";
import { FormSchemaBuilder } from "@/components/union/form-schema-builder";
import type { FormType } from "@/generated/prisma/client";

const FORM_TABS: { formType: FormType; label: string }[] = [
  { formType: "CLUB_APPLICATION", label: "Club Application" },
  { formType: "EVENT_APPROVAL", label: "Event Approval" },
  { formType: "FUNDING_REQUEST", label: "Funding Request" },
];

export default async function UnionFormsPage() {
  let institution;
  try {
    institution = await getActiveInstitution();
  } catch {
    return (
      <div className="flex h-screen items-center justify-center bg-page">
        <p className="text-sm text-copy-secondary">
          You don&apos;t have access to this page.
        </p>
      </div>
    );
  }

  const schemas = await Promise.all(
    FORM_TABS.map((tab) => getOrSeedFormSchema(institution, tab.formType))
  );

  return (
    <div className="min-h-screen bg-page p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 font-heading text-lg font-medium text-copy-primary">
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
    </div>
  );
}
