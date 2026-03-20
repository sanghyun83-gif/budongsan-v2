export type RepaymentType = "amortized";

export interface FinanceEstimateInput {
  priceManwon: number;
  ltvPct?: number;
  annualRatePct?: number;
  years?: number;
  repaymentType?: RepaymentType;
}

export interface FinanceEstimateResult {
  priceManwon: number;
  loanPrincipalManwon: number;
  monthlyPaymentManwon: number;
  totalInterestManwon: number;
  totalRepaymentManwon: number;
  assumptions: {
    ltvPct: number;
    annualRatePct: number;
    years: number;
    repaymentType: RepaymentType;
    months: number;
  };
}

const MANWON_TO_WON = 10_000;
const DEFAULT_LTV = 60;
const DEFAULT_ANNUAL_RATE = 4.0;
const DEFAULT_YEARS = 30;

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return clampNumber(Math.trunc(value), min, max);
}

function normalizeDecimal(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return clampNumber(value, min, max);
}

export function estimateFinance(input: FinanceEstimateInput): FinanceEstimateResult | null {
  const basePriceManwon = normalizeInteger(input.priceManwon, 0, 2_147_483_647);
  if (basePriceManwon <= 0) return null;

  const ltvPct = normalizeDecimal(input.ltvPct ?? DEFAULT_LTV, 0, 90);
  const annualRatePct = normalizeDecimal(input.annualRatePct ?? DEFAULT_ANNUAL_RATE, 0, 20);
  const years = normalizeInteger(input.years ?? DEFAULT_YEARS, 1, 40);
  const repaymentType: RepaymentType = input.repaymentType ?? "amortized";

  const loanPrincipalManwon = Math.round((basePriceManwon * ltvPct) / 100);
  const principalWon = loanPrincipalManwon * MANWON_TO_WON;
  const months = years * 12;
  const monthlyRate = annualRatePct / 100 / 12;

  let monthlyPaymentWon = 0;
  if (repaymentType === "amortized") {
    if (monthlyRate === 0) {
      monthlyPaymentWon = principalWon / months;
    } else {
      const power = (1 + monthlyRate) ** months;
      monthlyPaymentWon = (principalWon * monthlyRate * power) / (power - 1);
    }
  }

  const totalRepaymentWon = monthlyPaymentWon * months;
  const totalInterestWon = Math.max(0, totalRepaymentWon - principalWon);

  return {
    priceManwon: basePriceManwon,
    loanPrincipalManwon,
    monthlyPaymentManwon: Math.round(monthlyPaymentWon / MANWON_TO_WON),
    totalInterestManwon: Math.round(totalInterestWon / MANWON_TO_WON),
    totalRepaymentManwon: Math.round(totalRepaymentWon / MANWON_TO_WON),
    assumptions: {
      ltvPct,
      annualRatePct,
      years,
      repaymentType,
      months
    }
  };
}

