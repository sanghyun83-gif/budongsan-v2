import { NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const DEFAULT_PREWARM_KEYWORDS = ["더가온", "금강프라임빌", "래미안", "자이"];

function getBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

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

    const keywords = (process.env.PREWARM_KEYWORDS ?? DEFAULT_PREWARM_KEYWORDS.join(","))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);

    const baseUrl = getBaseUrl();
    const runs = await Promise.all(
      keywords.map(async (q) => {
        const startedAt = performance.now();
        try {
          const sp = new URLSearchParams({ q, page: "1", size: "24", sort: "latest", lite: "true" });
          const res = await fetch(`${baseUrl}/api/search?${sp.toString()}`, { cache: "no-store" });
          const ms = performance.now() - startedAt;
          return { q, ok: res.ok, status: res.status, ms: Math.round(ms) };
        } catch {
          const ms = performance.now() - startedAt;
          return { q, ok: false, status: 0, ms: Math.round(ms) };
        }
      })
    );

    return NextResponse.json({
      ok: true,
      warmedAt: new Date().toISOString(),
      baseUrl,
      runs
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
