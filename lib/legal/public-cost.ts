import { legalRules } from "@/lib/legal/rules";
import type { LegalPublicCostBreakdown } from "@/lib/legal/types";

export function calculateStampDuty(stampAmountWon: number): number {
  for (const bracket of legalRules.publicCost.stampDuty) {
    if (stampAmountWon <= bracket.upToWon) return bracket.dutyWon;
  }
  return legalRules.publicCost.stampDuty.at(-1)?.dutyWon ?? 0;
}

export function calculatePublicCost(stampAmountWon: number): LegalPublicCostBreakdown {
  const stampDutyWon = calculateStampDuty(stampAmountWon);
  return {
    stampDutyWon,
    localStampWon: legalRules.publicCost.localStampWon,
    certificateWon: legalRules.publicCost.certificateWon,
  };
}

export function sumPublicCost(cost: LegalPublicCostBreakdown): number {
  return cost.stampDutyWon + cost.localStampWon + cost.certificateWon;
}
