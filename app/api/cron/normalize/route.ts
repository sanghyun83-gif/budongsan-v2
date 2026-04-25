import { NextRequest, NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const DEFAULT_CHUNK = 50000;
const DEFAULT_MAX_CHUNKS = 4;
const MAX_CHUNK = 200000;
const MAX_MAX_CHUNKS = 20;

function isAuthorized(req: NextRequest, cronSecret: string) {
  const customHeader = req.headers.get("x-cron-secret");
  if (customHeader && customHeader === cronSecret) return true;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}

function parsePositiveInt(value: string | null, fallback: number, cap?: number) {
  const parsed = Number(value ?? "");
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  if (cap && parsed > cap) return cap;
  return parsed;
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

type NormalizeStepResult = {
  insertedCount: number;
  scannedCount: number;
  lastRawIdBefore: number;
  lastRawIdAfter: number;
};

async function normalizeChunk(chunkSize: number): Promise<NormalizeStepResult> {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      CREATE TABLE IF NOT EXISTS pipeline_state (
        state_key VARCHAR(80) PRIMARY KEY,
        value_text TEXT,
        value_bigint BIGINT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
      `
    );

    await client.query(
      `
      INSERT INTO pipeline_state (state_key, value_text, value_bigint)
      VALUES ('normalize_last_raw_id', '0', 0)
      ON CONFLICT (state_key) DO NOTHING
      `
    );

    const stateRes = await client.query<{ last_raw_id: number }>(
      `
      SELECT COALESCE(value_bigint, 0)::BIGINT AS last_raw_id
      FROM pipeline_state
      WHERE state_key = 'normalize_last_raw_id'
      FOR UPDATE
      `
    );

    const lastRawIdBefore = Number(stateRes.rows[0]?.last_raw_id ?? 0);

    const stepRes = await client.query<{
      scanned_count: number;
      inserted_count: number;
      last_raw_id_after: number;
    }>(
      `
      WITH candidates AS (
        SELECT
          r.id AS raw_id,
          r.complex_id,
          to_date(NULLIF(r.payload_json->>'deal_ymd', ''), 'YYYYMMDD') AS deal_date,
          NULLIF(regexp_replace(COALESCE(r.payload_json->>'deal_amount_manwon', ''), '[^0-9]', '', 'g'), '')::INTEGER AS deal_amount_manwon,
          NULLIF(regexp_replace(COALESCE(r.payload_json->>'area_m2', ''), '[^0-9\\.]', '', 'g'), '')::NUMERIC(8,2) AS area_m2,
          NULLIF(regexp_replace(COALESCE(r.payload_json->>'floor', ''), '[^0-9\\-]', '', 'g'), '')::INTEGER AS floor,
          NULLIF(regexp_replace(COALESCE(r.payload_json->>'build_year', ''), '[^0-9]', '', 'g'), '')::INTEGER AS build_year
        FROM deal_trade_raw r
        WHERE r.id > $1
          AND r.complex_id IS NOT NULL
        ORDER BY r.id
        LIMIT $2
      ),
      inserted AS (
        INSERT INTO deal_trade_normalized (
          complex_id, deal_date, deal_amount_manwon, area_m2, floor, build_year, source_raw_id
        )
        SELECT
          c.complex_id,
          c.deal_date,
          c.deal_amount_manwon,
          c.area_m2,
          c.floor,
          c.build_year,
          c.raw_id
        FROM candidates c
        WHERE c.deal_date IS NOT NULL
          AND c.deal_amount_manwon IS NOT NULL
          AND c.area_m2 IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM deal_trade_normalized n
            WHERE n.source_raw_id = c.raw_id
          )
        RETURNING source_raw_id
      ),
      agg AS (
        SELECT
          COALESCE(MAX(raw_id), $1)::BIGINT AS last_raw_id_after,
          COUNT(*)::INT AS scanned_count
        FROM candidates
      ),
      update_state AS (
        UPDATE pipeline_state p
        SET
          value_bigint = a.last_raw_id_after,
          value_text = a.last_raw_id_after::text,
          updated_at = NOW()
        FROM agg a
        WHERE p.state_key = 'normalize_last_raw_id'
        RETURNING p.value_bigint
      )
      SELECT
        a.scanned_count,
        (SELECT COUNT(*)::INT FROM inserted) AS inserted_count,
        a.last_raw_id_after
      FROM agg a
      `,
      [lastRawIdBefore, chunkSize]
    );

    await client.query("COMMIT");

    return {
      scannedCount: Number(stepRes.rows[0]?.scanned_count ?? 0),
      insertedCount: Number(stepRes.rows[0]?.inserted_count ?? 0),
      lastRawIdBefore,
      lastRawIdAfter: Number(stepRes.rows[0]?.last_raw_id_after ?? lastRawIdBefore)
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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

    const chunk = parsePositiveInt(req.nextUrl.searchParams.get("chunk"), DEFAULT_CHUNK, MAX_CHUNK);
    const maxChunks = parsePositiveInt(
      req.nextUrl.searchParams.get("maxChunks"),
      DEFAULT_MAX_CHUNKS,
      MAX_MAX_CHUNKS
    );

    let insertedCount = 0;
    let scannedCount = 0;
    let chunksRun = 0;
    let lastRawIdBefore = 0;
    let lastRawIdAfter = 0;

    for (let i = 0; i < maxChunks; i += 1) {
      const step = await normalizeChunk(chunk);
      chunksRun += 1;
      insertedCount += step.insertedCount;
      scannedCount += step.scannedCount;
      if (i === 0) lastRawIdBefore = step.lastRawIdBefore;
      lastRawIdAfter = step.lastRawIdAfter;

      if (step.scannedCount < chunk) break;
    }

    const ranAt = new Date().toISOString();
    const durationMs = Math.round(performance.now() - started);

    const detail = {
      insertedCount,
      scannedCount,
      chunksRun,
      chunk,
      maxChunks,
      lastRawIdBefore,
      lastRawIdAfter,
      durationMs,
      ranAt
    };

    await writeCronAudit("success", detail);

    console.info(
      `[cron-normalize] inserted=${insertedCount} scanned=${scannedCount} chunks=${chunksRun} raw_id=${lastRawIdBefore}->${lastRawIdAfter}`
    );
    return NextResponse.json({ ok: true, ...detail });
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
