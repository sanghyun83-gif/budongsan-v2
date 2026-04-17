import { formatKrw, formatManwon } from "@/lib/legal/format";

type Params = {
  ruleVersion: string;
  amountManwon: number;
  basicFeeWon: number;
  progressiveAddWon: number;
  typeAdjustmentWon: number;
  feeBeforeVatWon: number;
  feeCapWon: number;
  feeWon: number;
  vatWon: number;
  publicCostWon: number;
  totalWon: number;
};

export function buildBasisText(params: Params): string {
  const lines = [
    `요약: 과세표준 ${formatManwon(params.amountManwon)} 기준 최종 총비용은 ${formatKrw(params.totalWon)}입니다.`,
    "",
    `[법무사 보수 계산 근거 | 기준표 ${params.ruleVersion}]`,
    `- 과세표준: ${formatManwon(params.amountManwon)}`,
    `- 기본보수: ${formatKrw(params.basicFeeWon)}`,
    `- 누진가산: ${formatKrw(params.progressiveAddWon)}`,
    `- 유형 가감: ${formatKrw(params.typeAdjustmentWon)}`,
    `- 보수산출액: ${formatKrw(params.feeBeforeVatWon)}`,
    `- 보수상한: ${formatKrw(params.feeCapWon)}`,
    `- 적용보수: ${formatKrw(params.feeWon)}`,
    "",
    "[부가세·공공비용 반영 내역]",
    `- 부가세: ${formatKrw(params.vatWon)}`,
    `- 공공비용(인지·증지): ${formatKrw(params.publicCostWon)}`,
    `- 최종 합계: ${formatKrw(params.totalWon)}`,
    "",
    "안내: 실제 진행 전에는 사건별 추가 업무 범위를 포함한 최종 견적을 반드시 다시 확인하세요.",
  ];

  return lines.join("\n");
}
