import { NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

export async function GET() {
  const started = performance.now();
  let status = 200;

  try {
    if (!hasDatabaseUrl()) {
      status = 503;
      return NextResponse.json(
        { ok: false, code: "DB_NOT_CONFIGURED", error: "DATABASE_URL is not configured" },
        { status }
      );
    }

    const pool = getDbPool();

    const [rawRes, normRes, cronRes] = await Promise.all([
      pool.query(`
        SELECT
          MAX(ingested_at) AS last_raw_ingested_at,
          COUNT(*)::INT AS raw_count_24h
        FROM deal_trade_raw
        WHERE ingested_at >= (NOW() - INTERVAL '24 hours')
      `),
      pool.query(`
        SELECT
          MAX(deal_date) AS last_deal_date,
          COUNT(*)::INT AS normalized_count_24h
        FROM deal_trade_normalized
        WHERE created_at >= (NOW() - INTERVAL '24 hours')
      `),
      pool.query(`
        SELECT event_name, created_at, after_json
        FROM audit_log
        WHERE event_name IN ('cron_normalize_success', 'cron_normalize_error')
        ORDER BY created_at DESC
        LIMIT 5
      `)
    ]);

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      raw: {
        lastIngestedAt: rawRes.rows[0]?.last_raw_ingested_at ?? null,
        count24h: Number(rawRes.rows[0]?.raw_count_24h ?? 0)
      },
      normalized: {
        lastDealDate: normRes.rows[0]?.last_deal_date ?? null,
        count24h: Number(normRes.rows[0]?.normalized_count_24h ?? 0)
      },
      recentCronRuns: cronRes.rows.map((r) => ({
        event: r.event_name,
        at: r.created_at,
        detail: r.after_json
      }))
    });
  } catch (error) {
    logApiError("GET /api/ops/data-freshness", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = 500;
    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/ops/data-freshness", performance.now() - started, status);
  }
}
