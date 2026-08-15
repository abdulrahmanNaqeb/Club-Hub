import { schedules } from "@trigger.dev/sdk";

import { computeOverspendStatus } from "@/lib/compute-overspend-status";
import { prisma } from "@/lib/prisma";

export const checkOverspend = schedules.task({
  id: "check-overspend",
  cron: "0 6 * * *",
  run: async () => {
    const clubs = await prisma.club.findMany({
      where: { approvalStatus: "APPROVED" },
    });

    for (const club of clubs) {
      const status = await computeOverspendStatus(club);

      if (!status.isOverspent) {
        continue;
      }

      // openKey is unique per club while a flag is open, so this upsert is
      // a no-op if the club is already flagged — re-running the job never
      // creates a duplicate.
      await prisma.overspendFlag.upsert({
        where: { openKey: club.id },
        update: {},
        create: { clubId: club.id, openKey: club.id },
      });
    }
  },
});
