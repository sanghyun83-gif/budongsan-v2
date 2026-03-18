import { NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const SOURCE_LABEL = "국토교통부 실거래가 공개데이터";

function toTimestamp(value: unknown): number {
  if (!value) return 0;
  const ts = new Date(String(value)).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export async function GET() {
  const started = performance.now();
  let status = 200;

  try {
    if (!hasDatabaseUrl()) {
      return NextResponse.json({
        ok: true,
        source: "fallback",
        sourceLabel: SOURCE_LABEL,
        updatedAt: null,
        kpi: {
          totalComplexes: 0,
          deals3m: 0
        }
      });
    }

    const pool = getDbPool();
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::INT FROM complex) AS total_complexes,
        (
          SELECT COUNT(*)::INT
          FROM deal_trade_normalized
          WHERE deal_date >= (CURRENT_DATE - INTERVAL '3 months')
        ) AS deals_3m,
        (SELECT MAX(deal_date)::TIMESTAMPTZ FROM deal_trade_normalized) AS max_deal_date,
        (SELECT MAX(updated_at) FROM complex) AS max_complex_updated_at
    `);

    const row = result.rows[0] ?? {};
    const latestTs = Math.max(toTimestamp(row.max_deal_date), toTimestamp(row.max_complex_updated_at));
    const updatedAt = latestTs > 0 ? new Date(latestTs).toISOString() : null;

    return NextResponse.json({
      ok: true,
      source: "database",
      sourceLabel: SOURCE_LABEL,
      updatedAt,
      kpi: {
        totalComplexes: Number(row.total_complexes ?? 0),
        deals3m: Number(row.deals_3m ?? 0)
      }
    });
  } catch (error) {
    logApiError("GET /api/hub/kpi", error);
    status = 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/hub/kpi", performance.now() - started, status);
  }
}
