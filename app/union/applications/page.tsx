import { requireOrgMode } from "@/lib/get-org-mode";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app/app-shell";
import { ApplicationsQueue } from "@/components/union/applications-queue";
import { OverspendFlags } from "@/components/union/overspend-flags";
import { CLUB_NAME_FIELD_KEY, type FormField } from "@/lib/form-schema-defaults";
import type { FormAnswers } from "@/lib/validate-form-answers";

export default async function UnionApplicationsPage() {
  const institution = await requireOrgMode("union");

  const [applications, overspendFlags] = await Promise.all([
    prisma.clubApplication.findMany({
      where: { institutionId: institution.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.overspendFlag.findMany({
      where: { resolvedAt: null, club: { institutionId: institution.id } },
      include: { club: true },
      orderBy: { flaggedAt: "desc" },
    }),
  ]);

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

  const flagItems = overspendFlags.map((flag) => ({
    id: flag.id,
    clubName: flag.club.name,
    flaggedDate: flag.flaggedAt.toISOString().slice(0, 10),
  }));

  return (
    <AppShell mode="union" title="Applications">
      <div className="flex flex-col gap-6">
        <OverspendFlags flags={flagItems} />
        <ApplicationsQueue applications={items} />
      </div>
    </AppShell>
  );
}

function pickClubName(answers: FormAnswers): string {
  const value = answers[CLUB_NAME_FIELD_KEY];
  return typeof value === "string" && value.trim() ? value.trim() : "Untitled application";
}
