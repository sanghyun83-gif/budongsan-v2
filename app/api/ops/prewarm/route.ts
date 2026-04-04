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
    await pool.query("SELECT 1");

    return NextResponse.json({
      ok: true,
      warmedAt: new Date().toISOString()
    });
  } catch (error) {
    logApiError("GET /api/ops/prewarm", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = 500;
    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/ops/prewarm", performance.now() - started, status);
  }
}
