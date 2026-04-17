import { legalRules } from "@/lib/legal/rules";
import type { LegalInput } from "@/lib/legal/types";

export function validateLegalInput(input: LegalInput): string | null {
  if (!Number.isFinite(input.amountManwon) || input.amountManwon <= 0) {
    return "과세표준 금액을 입력하세요.";
  }

  if (input.amountManwon > legalRules.maxAmountManwon) {
    return `과세표준 금액이 너무 큽니다. (최대 ${legalRules.maxAmountManwon.toLocaleString("ko-KR")}만원)`;
  }

  if (input.includePublicCost && (!Number.isFinite(input.stampAmountManwon) || input.stampAmountManwon <= 0)) {
    return "공공비용 포함 시 기재금액을 입력하세요.";
  }

  return null;
}
