import { requireOrgMode } from "@/lib/get-org-mode";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app/app-shell";
import { ApplicationsQueue } from "@/components/union/applications-queue";
import { CLUB_NAME_FIELD_KEY, type FormField } from "@/lib/form-schema-defaults";
import type { FormAnswers } from "@/lib/validate-form-answers";

export default async function UnionApplicationsPage() {
  const institution = await requireOrgMode("union");

  const applications = await prisma.clubApplication.findMany({
    where: { institutionId: institution.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  const items = applications.map((application) => {
    const answers = application.answers as unknown as FormAnswers;
    return {
      id: application.id,
      clubName: pickClubName(answers),
      submittedDate: application.createdAt.toISOString().slice(0, 10),
      proposedAdminEmail: application.proposedAdminEmail,
      answers,
      schemaSnapshot: application.schemaSnapshot as unknown as FormField[],
    };
  });

  return (
    <AppShell mode="union" title="Applications">
      <ApplicationsQueue applications={items} />
    </AppShell>
  );
}

function pickClubName(answers: FormAnswers): string {
  const value = answers[CLUB_NAME_FIELD_KEY];
  return typeof value === "string" && value.trim() ? value.trim() : "Untitled application";
}
