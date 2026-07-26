import type { Club } from "@/generated/prisma/client";
import { prisma } from "./prisma";

export interface OverspendStatus {
  isOverspent: boolean;
  approvedBudget: number;
  approvedFundingSum: number;
}

// Placeholder signal pending 17-budget-categories-entries.md: BudgetEntry
// (real expense tracking) doesn't exist yet, so this compares
// Club.baselineBudgetAmount (cumulative approved budget, per
// 11-funding-request-queue.md) against the sum of its own APPROVED
// FundingRequest.amount as an internal-consistency sanity check, not real
// overspend detection. See 12-overspend-flagging.md.
export async function computeOverspendStatus(club: Club): Promise<OverspendStatus> {
  const result = await prisma.fundingRequest.aggregate({
    where: { clubId: club.id, status: "APPROVED" },
    _sum: { amount: true },
  });

  const approvedFundingSum = Number(result._sum.amount ?? 0);
  const approvedBudget = Number(club.baselineBudgetAmount);

  return {
    isOverspent: approvedFundingSum > approvedBudget,
    approvedBudget,
    approvedFundingSum,
  };
}
