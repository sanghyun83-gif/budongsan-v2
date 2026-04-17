import { buildBasisText } from "@/lib/legal/explain";
import { calculatePublicCost, sumPublicCost } from "@/lib/legal/public-cost";
import { legalRules } from "@/lib/legal/rules";
import type { LegalCalcResult, LegalInput } from "@/lib/legal/types";

const MANWON_TO_WON = 10_000;

function calcBracketFee(amountWon: number, brackets: ReadonlyArray<{ upToWon: number; rate: number }>): number {
  let remain = amountWon;
  let lower = 0;
  let total = 0;

  for (const bracket of brackets) {
    const upper = bracket.upToWon;
    const taxable = Math.max(0, Math.min(remain, upper - lower));
    if (taxable > 0) {
      total += taxable * bracket.rate;
      remain -= taxable;
    }
    lower = upper;
    if (remain <= 0) break;
  }

  return Math.round(total);
}

function calcBasicFee(amountWon: number, firstBracket: { upToWon: number; rate: number }): number {
  const basicTarget = Math.min(amountWon, firstBracket.upToWon);
  return Math.round(basicTarget * firstBracket.rate);
}

export function calculateLegalCommission(input: LegalInput): LegalCalcResult {
  const amountWon = input.amountManwon * MANWON_TO_WON;
  const stampAmountWon = input.stampAmountManwon * MANWON_TO_WON;
  const typeRule = legalRules.types[input.realEstateType];

  const bracketFeeWon = calcBracketFee(amountWon, legalRules.brackets);
  const basicFeeWon = calcBasicFee(amountWon, legalRules.brackets[0]);
  const progressiveAddWon = Math.max(0, bracketFeeWon - basicFeeWon);

  const multipliedFeeWon = Math.round(bracketFeeWon * typeRule.multiplier);
  const discountWon = Math.round(multipliedFeeWon * typeRule.discountRate);
  const surchargeWon = Math.round(multipliedFeeWon * typeRule.surchargeRate);
  const typeAdjustmentWon = surchargeWon - discountWon;

  const feeBeforeVatWon = multipliedFeeWon + typeAdjustmentWon;
  const feeCapWon = Math.round(amountWon * typeRule.maxFeeRate);
  const boundedCapWon = Math.max(feeCapWon, legalRules.minimumFeeWon);
  const feeWon = Math.min(Math.max(feeBeforeVatWon, legalRules.minimumFeeWon), boundedCapWon);

  const vatWon = Math.round(feeWon * legalRules.vatRate);

  const publicCostBreakdown = input.includePublicCost
    ? calculatePublicCost(stampAmountWon)
    : { stampDutyWon: 0, localStampWon: 0, certificateWon: 0 };
  const publicCostWon = sumPublicCost(publicCostBreakdown);

  const totalWon = feeWon + vatWon + publicCostWon;

  return {
    basicFeeWon,
    progressiveAddWon,
    typeAdjustmentWon,
    feeBeforeVatWon,
    feeCapWon: boundedCapWon,
    feeWon,
    vatWon,
    publicCostWon,
    totalWon,
    publicCostBreakdown,
    basisText: buildBasisText({
      ruleVersion: legalRules.version,
      amountManwon: input.amountManwon,
      basicFeeWon,
      progressiveAddWon,
      typeAdjustmentWon,
      feeBeforeVatWon,
      feeCapWon: boundedCapWon,
      feeWon,
      vatWon,
      publicCostWon,
      totalWon,
    }),
  };
}
