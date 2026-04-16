import type { DealType, RealEstateType, RateRule } from "@/lib/commission/types";

export function buildBasisText(input: {
  dealType: DealType;
  realEstateType: RealEstateType;
  customRate: number | null;
  rule: RateRule | null;
  isDistribution: boolean;
}): string {
  const { dealType, realEstateType, customRate, rule, isDistribution } = input;

  if (customRate !== null) {
    return `직접 입력 요율 ${(customRate * 100).toFixed(3)}% 적용`;
  }

  if (realEstateType === "officetel") {
    return `오피스텔 ${dealType === "sale" ? "매매" : "임대차"} 고정 상한요율 적용`;
  }

  if (realEstateType === "etc") {
    return "주택 이외 상한요율(9/1000) 적용";
  }

  if (rule) {
    return `주택 ${dealType === "sale" || isDistribution ? "매매" : "임대차"} 구간(${rule.label}) 적용`;
  }

  return "기본 요율 적용";
}
