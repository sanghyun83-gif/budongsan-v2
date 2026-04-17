export type RealEstateType = "house" | "building";

export type LegalInput = {
  realEstateType: RealEstateType;
  amountManwon: number;
  stampAmountManwon: number;
  includePublicCost: boolean;
};

export type LegalPublicCostBreakdown = {
  stampDutyWon: number;
  localStampWon: number;
  certificateWon: number;
};

export type LegalCalcResult = {
  basicFeeWon: number;
  progressiveAddWon: number;
  typeAdjustmentWon: number;
  feeBeforeVatWon: number;
  feeCapWon: number;
  feeWon: number;
  vatWon: number;
  publicCostWon: number;
  totalWon: number;
  publicCostBreakdown: LegalPublicCostBreakdown;
  basisText: string;
};

export type LegalResultRow = {
  id: string;
  seq: number;
  amountWon: number;
  basicFeeWon: number;
  progressiveAddWon: number;
  typeAdjustmentWon: number;
  feeBeforeVatWon: number;
  feeCapWon: number;
  feeWon: number;
  vatWon: number;
  stampDutyWon: number;
  localStampWon: number;
  certificateWon: number;
  publicCostWon: number;
  totalWon: number;
};

export type LegalHistoryItem = {
  id: string;
  label: string;
  createdAt: number;
  input: LegalInput;
  row: LegalResultRow;
  basisText: string;
};
