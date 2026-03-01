import { NextRequest, NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

function isAuthorized(req: NextRequest, cronSecret: string) {
  const customHeader = req.headers.get("x-cron-secret");
  if (customHeader && customHeader === cronSecret) return true;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}

async function writeCronAudit(status: "success" | "error", detail: Record<string, unknown>) {
  if (!hasDatabaseUrl()) return;
  const pool = getDbPool();

  await pool.query(
    `
    INSERT INTO audit_log (
      actor_type, actor_id, target_type, target_id, event_name, after_json, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
    `,
    ["system", null, "pipeline", null, `cron_normalize_${status}`, JSON.stringify(detail)]
  );
}

export async function GET(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      status = 503;
      return NextResponse.json(
        { ok: false, code: "CRON_SECRET_MISSING", error: "CRON_SECRET is not configured" },
        { status }
      );
    }

    if (!isAuthorized(req, cronSecret)) {
      status = 401;
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED", error: "Invalid cron secret" }, { status });
    }

    if (!hasDatabaseUrl()) {
      status = 503;
      return NextResponse.json(
        { ok: false, code: "DB_NOT_CONFIGURED", error: "DATABASE_URL is not configured" },
        { status }
      );
    }

    const pool = getDbPool();
    const sql = `
      WITH src AS (
        SELECT
          r.id AS raw_id,
          r.complex_id,
          to_date(NULLIF(r.payload_json->>'deal_ymd', ''), 'YYYYMMDD') AS deal_date,
          NULLIF(regexp_replace(COALESCE(r.payload_json->>'deal_amount_manwon', ''), '[^0-9]', '', 'g'), '')::INTEGER AS deal_amount_manwon,
          NULLIF(regexp_replace(COALESCE(r.payload_json->>'area_m2', ''), '[^0-9\\.]', '', 'g'), '')::NUMERIC(8,2) AS area_m2,
          NULLIF(regexp_replace(COALESCE(r.payload_json->>'floor', ''), '[^0-9\\-]', '', 'g'), '')::INTEGER AS floor,
          NULLIF(regexp_replace(COALESCE(r.payload_json->>'build_year', ''), '[^0-9]', '', 'g'), '')::INTEGER AS build_year
        FROM deal_trade_raw r
        WHERE r.complex_id IS NOT NULL
      ),
      inserted AS (
        INSERT INTO deal_trade_normalized (
          complex_id, deal_date, deal_amount_manwon, area_m2, floor, build_year, source_raw_id
        )
        SELECT
          s.complex_id,
          s.deal_date,
          s.deal_amount_manwon,
          s.area_m2,
          s.floor,
          s.build_year,
          s.raw_id
        FROM src s
        WHERE
          s.deal_date IS NOT NULL
          AND s.deal_amount_manwon IS NOT NULL
          AND s.area_m2 IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM deal_trade_normalized n WHERE n.source_raw_id = s.raw_id
          )
        RETURNING id
      )
      SELECT COUNT(*)::INT AS inserted_count FROM inserted
    `;

    const result = await pool.query<{ inserted_count: number }>(sql);
    const insertedCount = result.rows[0]?.inserted_count ?? 0;
    const ranAt = new Date().toISOString();

    await writeCronAudit("success", { insertedCount, ranAt });

    console.info(`[cron-normalize] inserted_count=${insertedCount}`);
    return NextResponse.json({ ok: true, insertedCount, ranAt });
  } catch (error) {
    logApiError("GET /api/cron/normalize", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = 500;

    try {
      await writeCronAudit("error", { message, ranAt: new Date().toISOString() });
    } catch {
      // ignore audit write failure
    }

    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/cron/normalize", performance.now() - started, status);
  }
}
