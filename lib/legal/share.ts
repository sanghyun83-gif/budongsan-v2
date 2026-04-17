import type { LegalInput, RealEstateType } from "@/lib/legal/types";

export function buildLegalShareUrl(input: LegalInput): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams({
    type: input.realEstateType,
    amount: String(input.amountManwon),
    stamp: String(input.stampAmountManwon),
    publicCost: input.includePublicCost ? "1" : "0",
  });
  return `${window.location.origin}/legal?${params.toString()}`;
}

export function parseLegalShareQuery(search: string): Partial<LegalInput> {
  const params = new URLSearchParams(search);
  const typeRaw = params.get("type");
  const realEstateType: RealEstateType = typeRaw === "building" ? "building" : "house";

  const amountManwon = Number(params.get("amount") ?? 0);
  const stampAmountManwon = Number(params.get("stamp") ?? 0);
  const includePublicCost = params.get("publicCost") === "1";

  return {
    realEstateType,
    amountManwon: Number.isFinite(amountManwon) && amountManwon > 0 ? amountManwon : undefined,
    stampAmountManwon: Number.isFinite(stampAmountManwon) && stampAmountManwon > 0 ? stampAmountManwon : undefined,
    includePublicCost,
  };
}
