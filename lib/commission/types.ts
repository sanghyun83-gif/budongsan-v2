export type DealType = "sale" | "lease" | "rent";
export type RealEstateType = "house" | "officetel" | "distribution" | "etc";

export type CommissionInput = {
  dealType: DealType;
  realEstateType: RealEstateType;
  amountManwon: number;
  rentManwon?: number;
  premiumManwon?: number;
  customRatePct?: number | null;
  vatRatePct?: number | null;
};

export type CommissionResult = {
  transactionAmountManwon: number;
  appliedRate: number;
  rateLabel: string;
  upperLimitManwon: number | null;
  commissionManwon: number;
  vatRate: number;
  vatManwon: number;
  totalManwon: number;
  basisText: string;
};

export type RateRule = {
  maxExclusive: number | null;
  rate: number;
  limitManwon: number | null;
  label: string;
};
