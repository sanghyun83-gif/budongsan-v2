import { NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const EXACT_RATIO_GATE = 0.8;

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
    const [summaryRes, queueRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::INT AS total_complexes,
          COUNT(*) FILTER (WHERE location_source = 'exact')::INT AS exact_complexes,
          COUNT(*) FILTER (WHERE location_source = 'approx')::INT AS approx_complexes,
          COALESCE(ROUND(
            (COUNT(*) FILTER (WHERE location_source = 'exact'))::NUMERIC
            / NULLIF(COUNT(*), 0),
            4
          ), 0) AS exact_ratio
        FROM complex
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending')::INT AS pending,
          COUNT(*) FILTER (WHERE status = 'failed')::INT AS failed,
          COUNT(*) FILTER (WHERE status = 'success')::INT AS success,
          COUNT(*) FILTER (WHERE status = 'permanent_failed')::INT AS permanent_failed
        FROM geocode_backfill_queue
      `)
    ]);

    const s = summaryRes.rows[0] ?? {};
    const q = queueRes.rows[0] ?? {};

    const exactRatio = Number(s.exact_ratio ?? 0);
    const precisionMapEnabled = exactRatio >= EXACT_RATIO_GATE;

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      kpi: {
        totalComplexes: Number(s.total_complexes ?? 0),
        exactComplexes: Number(s.exact_complexes ?? 0),
        approxComplexes: Number(s.approx_complexes ?? 0),
        exactRatio,
        exactRatioGate: EXACT_RATIO_GATE,
        precisionMapEnabled
      },
      queue: {
        pending: Number(q.pending ?? 0),
        failed: Number(q.failed ?? 0),
        success: Number(q.success ?? 0),
        permanentFailed: Number(q.permanent_failed ?? 0)
      }
    });
  } catch (error) {
    logApiError("GET /api/ops/location-quality", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = 500;
    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/ops/location-quality", performance.now() - started, status);
  }
}
