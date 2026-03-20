import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { estimateFinance } from "@/lib/finance/estimate";
import { logApiError, recordApiMetric } from "@/lib/observability";

const SOURCE_LABEL = "국토교통부 실거래가 공개데이터";
const DISCLAIMER = "본 계산은 참고용이며 실제 금융 조건(금리/한도/수수료)과 다를 수 있습니다.";

const querySchema = z
  .object({
    complex_id: z.coerce.number().int().positive().optional(),
    price_manwon: z.coerce.number().int().min(0).max(2_147_483_647).optional(),
    ltv: z.coerce.number().min(0).max(90).default(60),
    annual_rate: z.coerce.number().min(0).max(20).default(4.0),
    years: z.coerce.number().int().min(1).max(40).default(30)
  })
  .refine((input) => input.complex_id !== undefined || input.price_manwon !== undefined, {
    message: "complex_id or price_manwon is required"
  });

async function resolvePriceFromComplex(complexId: number): Promise<{ aptName: string; priceManwon: number | null; updatedAt: string | null } | null> {
  if (!hasDatabaseUrl()) return null;
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      c.apt_name,
      c.updated_at,
      latest.deal_amount_manwon,
      latest.deal_date
    FROM complex c
    LEFT JOIN LATERAL (
      SELECT d.deal_amount_manwon, d.deal_date
      FROM deal_trade_normalized d
      WHERE d.complex_id = c.id
      ORDER BY d.deal_date DESC
      LIMIT 1
    ) latest ON true
    WHERE c.id = $1
    LIMIT 1
  `,
    [complexId]
  );

  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  const latestTs = Math.max(
    row.deal_date ? new Date(row.deal_date).getTime() : 0,
    row.updated_at ? new Date(row.updated_at).getTime() : 0
  );

  return {
    aptName: String(row.apt_name ?? ""),
    priceManwon: row.deal_amount_manwon === null ? null : Number(row.deal_amount_manwon),
    updatedAt: latestTs > 0 ? new Date(latestTs).toISOString() : null
  };
}

export async function GET(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    const params = req.nextUrl.searchParams;
    const input = querySchema.parse({
      complex_id: params.get("complex_id") ?? undefined,
      price_manwon: params.get("price_manwon") ?? undefined,
      ltv: params.get("ltv") ?? 60,
      annual_rate: params.get("annual_rate") ?? 4.0,
      years: params.get("years") ?? 30
    });

    let basePriceManwon = input.price_manwon ?? null;
    let aptName: string | null = null;
    let updatedAt: string | null = null;

    if (input.complex_id !== undefined) {
      const complexResolved = await resolvePriceFromComplex(input.complex_id);
      if (!complexResolved) {
        status = 404;
        return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Complex not found" }, { status });
      }
      aptName = complexResolved.aptName;
      updatedAt = complexResolved.updatedAt;
      if (basePriceManwon === null) {
        basePriceManwon = complexResolved.priceManwon;
      }
    }

    if (basePriceManwon === null || basePriceManwon <= 0) {
      status = 400;
      return NextResponse.json({ ok: false, code: "INVALID_PRICE", error: "A positive base price is required" }, { status });
    }

    const estimate = estimateFinance({
      priceManwon: basePriceManwon,
      ltvPct: input.ltv,
      annualRatePct: input.annual_rate,
      years: input.years,
      repaymentType: "amortized"
    });

    if (!estimate) {
      status = 400;
      return NextResponse.json({ ok: false, code: "ESTIMATE_FAILED", error: "Failed to estimate finance values" }, { status });
    }

    return NextResponse.json({
      ok: true,
      sourceLabel: SOURCE_LABEL,
      updatedAt,
      disclaimer: DISCLAIMER,
      complex: input.complex_id ? { id: input.complex_id, aptName } : null,
      estimate
    });
  } catch (error) {
    logApiError("GET /api/hub/finance-estimate", error);
    status = 400;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/hub/finance-estimate", performance.now() - started, status);
  }
}

