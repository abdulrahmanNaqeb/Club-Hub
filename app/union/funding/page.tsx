import { requireOrgMode } from "@/lib/get-org-mode";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app/app-shell";
import { FundingQueue } from "@/components/union/funding-queue";
import type { FormField } from "@/lib/form-schema-defaults";
import type { FormAnswers } from "@/lib/validate-form-answers";

export default async function UnionFundingPage() {
  const institution = await requireOrgMode("union");

  const requests = await prisma.fundingRequest.findMany({
    where: { status: "PENDING", club: { institutionId: institution.id } },
    include: { club: true },
    orderBy: { createdAt: "desc" },
  });

  const items = requests.map((request) => ({
    id: request.id,
    clubName: request.club.name,
    amount: Number(request.amount),
    submittedDate: request.createdAt.toISOString().slice(0, 10),
    answers: request.answers as unknown as FormAnswers,
    schemaSnapshot: request.schemaSnapshot as unknown as FormField[],
  }));

  return (
    <AppShell mode="union" title="Funding">
      <FundingQueue requests={items} />
    </AppShell>
  );
}
