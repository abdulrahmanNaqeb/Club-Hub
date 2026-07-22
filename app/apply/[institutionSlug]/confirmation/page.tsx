import { getInstitutionBySlug } from "@/lib/institution-scope";

export default async function ApplyConfirmationPage({
  params,
}: PageProps<"/apply/[institutionSlug]/confirmation">) {
  const { institutionSlug } = await params;
  const institution = await getInstitutionBySlug(institutionSlug);

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6">
      <div className="max-w-md text-center">
        <h1 className="mb-2 font-heading text-lg font-medium text-copy-primary">
          Application submitted
        </h1>
        <p className="text-sm text-copy-secondary">
          {institution
            ? `You'll hear back once ${institution.name}'s union reviews it.`
            : "You'll hear back once the union reviews it."}
        </p>
      </div>
    </div>
  );
}
