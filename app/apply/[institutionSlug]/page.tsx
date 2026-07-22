import { getInstitutionBySlug } from "@/lib/institution-scope";
import { getOrSeedFormSchema, type FormField } from "@/lib/form-schema-defaults";
import { ApplyForm } from "@/components/apply/apply-form";

export default async function ApplyPage({
  params,
}: PageProps<"/apply/[institutionSlug]">) {
  const { institutionSlug } = await params;
  const institution = await getInstitutionBySlug(institutionSlug);

  if (!institution) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-6">
        <p className="text-sm text-copy-secondary">
          This institution isn&apos;t set up yet.
        </p>
      </div>
    );
  }

  const schema = await getOrSeedFormSchema(institution, "CLUB_APPLICATION");
  const fields = schema.fields as unknown as FormField[];

  return (
    <div className="min-h-screen bg-page p-6">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 font-heading text-lg font-medium text-copy-primary">
          Apply to start a club at {institution.name}
        </h1>
        <p className="mb-6 text-sm text-copy-secondary">
          Fill out the form below — {institution.name}&apos;s union will
          review your application.
        </p>

        <ApplyForm institutionSlug={institutionSlug} fields={fields} />
      </div>
    </div>
  );
}
