import { requireOrgMode } from "@/lib/get-org-mode";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app/app-shell";
import { EventsQueue } from "@/components/union/events-queue";
import { EVENT_NAME_FIELD_KEY, type FormField } from "@/lib/form-schema-defaults";
import type { FormAnswers } from "@/lib/validate-form-answers";

export default async function UnionEventsPage() {
  const institution = await requireOrgMode("union");

  const requests = await prisma.eventApprovalRequest.findMany({
    where: { status: "PENDING", club: { institutionId: institution.id } },
    include: { club: true },
    orderBy: { createdAt: "desc" },
  });

  const items = requests.map((request) => {
    const answers = request.answers as unknown as FormAnswers;
    return {
      id: request.id,
      clubName: request.club.name,
      eventName: pickEventName(answers),
      submittedDate: request.createdAt.toISOString().slice(0, 10),
      answers,
      schemaSnapshot: request.schemaSnapshot as unknown as FormField[],
    };
  });

  return (
    <AppShell mode="union" title="Events">
      <EventsQueue requests={items} />
    </AppShell>
  );
}

function pickEventName(answers: FormAnswers): string {
  const value = answers[EVENT_NAME_FIELD_KEY];
  return typeof value === "string" && value.trim() ? value.trim() : "Untitled event";
}
