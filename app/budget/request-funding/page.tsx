import { getActiveClub } from "@/lib/org-scope";
import { prisma } from "@/lib/prisma";
import { getOrSeedFormSchema, type FormField } from "@/lib/form-schema-defaults";
import { RequestFundingForm } from "@/components/budget/request-funding-form";

export default async function RequestFundingPage() {
  let club;
  try {
    club = await getActiveClub();
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-6">
        <p className="text-sm text-copy-secondary">
          You don&apos;t have access to this page.
        </p>
      </div>
    );
  }

  const institution = await prisma.institution.findUnique({
    where: { id: club.institutionId },
  });

  if (!institution) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-6">
        <p className="text-sm text-copy-secondary">
          This club&apos;s institution isn&apos;t set up yet.
        </p>
      </div>
    );
  }

  const schema = await getOrSeedFormSchema(institution, "FUNDING_REQUEST");
  const fields = schema.fields as unknown as FormField[];

  return (
    <div className="min-h-screen bg-page p-6">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 font-heading text-3xl font-medium text-copy-primary">
          Request funding
        </h1>
        <p className="mb-6 text-sm text-copy-secondary">
          Fill out the form below — {institution.name}&apos;s union will
          review your request.
        </p>

        <RequestFundingForm fields={fields} />
      </div>
    </div>
  );
}
