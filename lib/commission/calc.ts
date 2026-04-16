import { buildBasisText } from "@/lib/commission/explain";
import {
  DEFAULT_VAT_RATE,
  ETC_MAX_RATE,
  HOUSE_LEASE_RULES,
  HOUSE_SALE_RULES,
  OFFICETEL_LEASE_RATE,
  OFFICETEL_SALE_RATE,
} from "@/lib/commission/rules";
import type { CommissionInput, CommissionResult, RateRule } from "@/lib/commission/types";

export type { CommissionInput, CommissionResult } from "@/lib/commission/types";
export type { DealType, RealEstateType } from "@/lib/commission/types";

function pickRule(rules: RateRule[], amountManwon: number): RateRule {
  for (const rule of rules) {
    if (rule.maxExclusive === null || amountManwon < rule.maxExclusive) return rule;
  }
  return rules[rules.length - 1];
}

function sanitizeNumber(value: number | undefined | null): number {
  if (value === undefined || value === null || Number.isNaN(value)) return 0;
  return Math.max(0, value);
}

export function calculateCommission(input: CommissionInput): CommissionResult {
  const amountManwon = sanitizeNumber(input.amountManwon);
  const rentManwon = sanitizeNumber(input.rentManwon);
  const premiumManwon = sanitizeNumber(input.premiumManwon);

  let transactionAmountManwon = amountManwon;
  const isDistribution = input.realEstateType === "distribution";

  if (input.dealType === "rent") {
    transactionAmountManwon = amountManwon + rentManwon * 100;
  }

  if (isDistribution) {
    transactionAmountManwon = amountManwon + premiumManwon;
  }

  const vatRate = sanitizeNumber(input.vatRatePct ?? DEFAULT_VAT_RATE * 100) / 100;
  const customRate =
    input.customRatePct === null || input.customRatePct === undefined ? null : sanitizeNumber(input.customRatePct) / 100;

  let appliedRate = 0;
  let upperLimitManwon: number | null = null;
  let matchedRule: RateRule | null = null;

  if (customRate !== null) {
    appliedRate = customRate;
  } else if (input.realEstateType === "officetel") {
    appliedRate = input.dealType === "sale" ? OFFICETEL_SALE_RATE : OFFICETEL_LEASE_RATE;
  } else if (input.realEstateType === "etc") {
    appliedRate = ETC_MAX_RATE;
  } else {
    const rules = input.dealType === "sale" || isDistribution ? HOUSE_SALE_RULES : HOUSE_LEASE_RULES;
    matchedRule = pickRule(rules, transactionAmountManwon);
    appliedRate = matchedRule.rate;
    upperLimitManwon = matchedRule.limitManwon;
  }

  const rawCommission = transactionAmountManwon * appliedRate;
  const commissionManwon = upperLimitManwon === null ? rawCommission : Math.min(rawCommission, upperLimitManwon);
  const vatManwon = commissionManwon * vatRate;
  const totalManwon = commissionManwon + vatManwon;
  const basisText = buildBasisText({
    dealType: input.dealType,
    realEstateType: input.realEstateType,
    customRate,
    rule: matchedRule,
    isDistribution,
  });

  return {
    transactionAmountManwon,
    appliedRate,
    rateLabel: `${(appliedRate * 100).toFixed(3)}%`,
    upperLimitManwon,
    commissionManwon,
    vatRate,
    vatManwon,
    totalManwon,
    basisText,
  };
}
