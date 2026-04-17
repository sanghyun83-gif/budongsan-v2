import productionRulesRaw from "@/lib/legal/rules.production.json";
import type { RealEstateType } from "@/lib/legal/types";

type FeeBracket = { upToWon: number; rate: number };
type StampDutyBracket = { upToWon: number; dutyWon: number };

type RuleTypeConfig = {
  multiplier: number;
  discountRate: number;
  surchargeRate: number;
  maxFeeRate: number;
};

export type LegalRules = {
  version: string;
  maxAmountManwon: number;
  vatRate: number;
  minimumFeeWon: number;
  types: Record<RealEstateType, RuleTypeConfig>;
  brackets: FeeBracket[];
  publicCost: {
    localStampWon: number;
    certificateWon: number;
    stampDuty: StampDutyBracket[];
  };
};

export const legalRules: LegalRules = productionRulesRaw;
