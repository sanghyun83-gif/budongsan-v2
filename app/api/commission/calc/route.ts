import { NextRequest, NextResponse } from "next/server";
import { calculateCommission, type DealType, type RealEstateType } from "@/lib/commission/calc";

function asDealType(value: unknown): DealType {
  return value === "lease" || value === "rent" ? value : "sale";
}

function asRealEstateType(value: unknown): RealEstateType {
  if (value === "officetel" || value === "distribution" || value === "etc") return value;
  return "house";
}

function asNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = calculateCommission({
      dealType: asDealType(body?.dealType),
      realEstateType: asRealEstateType(body?.realEstateType),
      amountManwon: asNumber(body?.amountManwon),
      rentManwon: asNumber(body?.rentManwon),
      premiumManwon: asNumber(body?.premiumManwon),
      customRatePct: body?.customRatePct === null || body?.customRatePct === undefined ? null : asNumber(body?.customRatePct),
      vatRatePct: body?.vatRatePct === null || body?.vatRatePct === undefined ? 10 : asNumber(body?.vatRatePct),
    });

    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json({ ok: false, error: "계산 요청 처리 중 오류가 발생했습니다." }, { status: 400 });
  }
}
