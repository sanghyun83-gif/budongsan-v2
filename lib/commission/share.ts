import type { CommissionInput } from "@/lib/commission/types";

export function buildCommissionShareQuery(input: CommissionInput) {
  const sp = new URLSearchParams();
  sp.set("dealType", input.dealType);
  sp.set("realEstateType", input.realEstateType);
  sp.set("amount", String(input.amountManwon || 0));
  if (input.rentManwon) sp.set("rent", String(input.rentManwon));
  if (input.premiumManwon) sp.set("premium", String(input.premiumManwon));
  if (input.customRatePct !== null && input.customRatePct !== undefined) sp.set("customRate", String(input.customRatePct));
  if (input.vatRatePct !== null && input.vatRatePct !== undefined) sp.set("vat", String(input.vatRatePct));
  return sp.toString();
}

export function parseCommissionShareQuery(sp: URLSearchParams): Partial<CommissionInput> {
  const dealType = (sp.get("dealType") ?? "sale") as CommissionInput["dealType"];
  const realEstateType = (sp.get("realEstateType") ?? "house") as CommissionInput["realEstateType"];
  return {
    dealType,
    realEstateType,
    amountManwon: Number(sp.get("amount") ?? 0),
    rentManwon: Number(sp.get("rent") ?? 0),
    premiumManwon: Number(sp.get("premium") ?? 0),
    customRatePct: sp.get("customRate") ? Number(sp.get("customRate")) : null,
    vatRatePct: sp.get("vat") ? Number(sp.get("vat")) : undefined,
  };
}
