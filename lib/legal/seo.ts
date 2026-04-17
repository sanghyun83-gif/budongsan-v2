export const LEGAL_CTR_TITLE_VARIANTS = {
  A: "법무사 보수 계산기 | 등기비용 전 확인해야 할 보수·인지·증지 계산",
  B: "법무사 보수 계산기 추천 | 과세표준·인지대·증지대 한 번에 계산",
  C: "등기비용 계산 전 필수: 법무사 보수·부가세·인지·증지 자동 계산기",
} as const;

export type LegalSeoVariant = keyof typeof LEGAL_CTR_TITLE_VARIANTS;

export function resolveLegalSeoVariant(): LegalSeoVariant {
  const raw = (process.env.LEGAL_SEO_VARIANT || "A").toUpperCase();
  if (raw === "B") return "B";
  if (raw === "C") return "C";
  return "A";
}

export function getActiveLegalSeoTitle(): string {
  const variant = resolveLegalSeoVariant();
  return LEGAL_CTR_TITLE_VARIANTS[variant];
}
