import { NextRequest, NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const SOURCE_LABEL = "국토교통부 실거래가 공개데이터";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

function parseLimit(params: URLSearchParams): number {
  const raw = Number(params.get("limit") ?? DEFAULT_LIMIT);
  if (!Number.isFinite(raw)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(raw)));
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    const limit = parseLimit(req.nextUrl.searchParams);

    if (!hasDatabaseUrl()) {
      return NextResponse.json({
        ok: true,
        source: "fallback",
        sourceLabel: SOURCE_LABEL,
        updatedAt: null,
        items: []
      });
    }

    const pool = getDbPool();
    const result = await pool.query(
      `
      SELECT
        d.id,
        d.complex_id,
        c.apt_name,
        c.legal_dong,
        r.name_ko AS region_name,
        d.deal_date,
        d.deal_amount_manwon,
        CASE
          WHEN d.deal_date >= (CURRENT_DATE - INTERVAL '3 days') THEN true
          ELSE false
        END AS is_new
      FROM deal_trade_normalized d
      JOIN complex c ON c.id = d.complex_id
      JOIN region r ON r.id = c.region_id
      WHERE d.deal_date >= date_trunc('month', CURRENT_DATE)::DATE
        AND d.deal_date < (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::DATE
      ORDER BY d.deal_amount_manwon DESC NULLS LAST, d.deal_date DESC, d.id DESC
      LIMIT $1
      `,
      [limit]
    );

    const items = result.rows.map((row, index) => ({
      rank: index + 1,
      dealId: Number(row.id),
      complexId: Number(row.complex_id),
      aptName: String(row.apt_name ?? ""),
      legalDong: String(row.legal_dong ?? ""),
      regionName: String(row.region_name ?? ""),
      dealDate: toIso(row.deal_date),
      dealAmountManwon: row.deal_amount_manwon === null ? null : Number(row.deal_amount_manwon),
      isNew: Boolean(row.is_new)
    }));

    const latestTs = items.reduce((max, item) => {
      if (!item.dealDate) return max;
      const ts = new Date(item.dealDate).getTime();
      return Number.isFinite(ts) ? Math.max(max, ts) : max;
    }, 0);

    return NextResponse.json({
      ok: true,
      source: "database",
      sourceLabel: SOURCE_LABEL,
      updatedAt: latestTs > 0 ? new Date(latestTs).toISOString() : null,
      items
    });
  } catch (error) {
    logApiError("GET /api/home/top-month-deals", error);
    status = 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/home/top-month-deals", performance.now() - started, status);
  }
}
