import { NextRequest, NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

type QueueRow = {
  task_id: number;
  complex_id: number;
  attempts: number;
  max_attempts: number;
  apt_name: string;
  legal_dong: string;
  region_name: string;
};

function isAuthorized(req: NextRequest, cronSecret: string) {
  const customHeader = req.headers.get("x-cron-secret");
  if (customHeader && customHeader === cronSecret) return true;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}

function authHeaders() {
  return { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` };
}

function normalizeText(s: unknown) {
  return String(s ?? "").trim();
}

function normalizeDong(s: unknown) {
  return normalizeText(s).replace(/\([^)]*\)/g, "").replace(/\s+/g, "");
}

function normalizeAptName(name: unknown) {
  return normalizeText(name)
    .replace(/\([^)]*\)/g, " ")
    .replace(/[\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildQueryCandidates(row: QueueRow) {
  const region = normalizeText(row.region_name);
  const dong = normalizeText(row.legal_dong);
  const apt = normalizeAptName(row.apt_name);
  const aptShort = apt.replace(/\s+/g, "");

  const candidates = [
    `${region} ${dong} ${apt}`,
    `${dong} ${apt}`,
    `${region} ${apt}`,
    apt,
    aptShort,
    `${region} ${dong}`
  ]
    .map((x) => x.trim())
    .filter(Boolean);

  return [...new Set(candidates)];
}

function pickBestDoc(row: QueueRow, docs: Array<Record<string, unknown>>) {
  if (!docs || docs.length === 0) return null;

  const targetDong = normalizeDong(row.legal_dong);
  const targetRegion = normalizeText(row.region_name);
  const targetApt = normalizeAptName(row.apt_name).replace(/\s+/g, "");

  let best: Record<string, unknown> | null = null;
  let bestScore = -1;

  for (const d of docs) {
    const text = [
      d.place_name,
      d.address_name,
      d.road_address_name,
      (d.address as { address_name?: string } | undefined)?.address_name,
      (d.address as { region_2depth_name?: string } | undefined)?.region_2depth_name,
      (d.address as { region_3depth_name?: string } | undefined)?.region_3depth_name,
      (d.road_address as { address_name?: string } | undefined)?.address_name,
      (d.road_address as { region_2depth_name?: string } | undefined)?.region_2depth_name,
      (d.road_address as { region_3depth_name?: string } | undefined)?.region_3depth_name
    ]
      .filter(Boolean)
      .join(" ");

    const normalizedText = normalizeText(text).replace(/\s+/g, "");

    let score = 0;
    if (targetRegion && normalizedText.includes(targetRegion)) score += 0.25;
    if (targetDong && normalizedText.includes(targetDong)) score += 0.45;
    if (targetApt && normalizedText.includes(targetApt)) score += 0.3;

    if (score > bestScore && d.x && d.y) {
      best = d;
      bestScore = score;
    }
  }

  return best;
}

async function kakaoKeywordSearch(query: string) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "10");

  const res = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Kakao keyword search failed: ${res.status}`);

  const json = (await res.json()) as { documents?: Array<Record<string, unknown>> };
  return json.documents ?? [];
}

async function kakaoAddressSearch(query: string) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
  url.searchParams.set("query", query);
  url.searchParams.set("analyze_type", "similar");
  url.searchParams.set("size", "10");

  const res = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Kakao address search failed: ${res.status}`);

  const json = (await res.json()) as { documents?: Array<Record<string, unknown>> };
  return json.documents ?? [];
}

async function kakaoCoordToAddress(lng: number, lat: number) {
  const url = new URL("https://dapi.kakao.com/v2/local/geo/coord2address.json");
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));

  const res = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Kakao reverse geocode failed: ${res.status}`);

  const json = (await res.json()) as { documents?: Array<Record<string, unknown>> };
  return (json.documents ?? [])[0] ?? null;
}

function computeConfidence(row: QueueRow, selectedDoc: Record<string, unknown>, reverseDoc: Record<string, unknown> | null) {
  let score = 0;

  const targetDong = normalizeDong(row.legal_dong);
  const targetRegion = normalizeText(row.region_name);

  const docText = [
    selectedDoc?.place_name,
    selectedDoc?.address_name,
    selectedDoc?.road_address_name,
    (selectedDoc?.address as { address_name?: string } | undefined)?.address_name,
    (selectedDoc?.address as { region_2depth_name?: string } | undefined)?.region_2depth_name,
    (selectedDoc?.address as { region_3depth_name?: string } | undefined)?.region_3depth_name,
    (selectedDoc?.road_address as { address_name?: string } | undefined)?.address_name,
    (selectedDoc?.road_address as { region_2depth_name?: string } | undefined)?.region_2depth_name,
    (selectedDoc?.road_address as { region_3depth_name?: string } | undefined)?.region_3depth_name
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, "");

  const reverseText = [
    (reverseDoc?.address as { address_name?: string } | undefined)?.address_name,
    (reverseDoc?.address as { region_2depth_name?: string } | undefined)?.region_2depth_name,
    (reverseDoc?.address as { region_3depth_name?: string } | undefined)?.region_3depth_name,
    (reverseDoc?.road_address as { address_name?: string } | undefined)?.address_name,
    (reverseDoc?.road_address as { region_2depth_name?: string } | undefined)?.region_2depth_name,
    (reverseDoc?.road_address as { region_3depth_name?: string } | undefined)?.region_3depth_name
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, "");

  if (targetRegion && docText.includes(targetRegion)) score += 0.2;
  if (targetDong && docText.includes(targetDong)) score += 0.35;
  if (targetRegion && reverseText.includes(targetRegion)) score += 0.15;
  if (targetDong && reverseText.includes(targetDong)) score += 0.3;

  return Math.min(1, Number(score.toFixed(4)));
}

async function findBestGeocode(row: QueueRow) {
  const candidates = buildQueryCandidates(row);

  for (const q of candidates) {
    const keywordDocs = await kakaoKeywordSearch(q);
    const bestKeyword = pickBestDoc(row, keywordDocs);
    if (bestKeyword?.x && bestKeyword?.y) {
      return { query: q, doc: bestKeyword, source: "keyword" as const };
    }

    const addressDocs = await kakaoAddressSearch(q);
    const bestAddress = pickBestDoc(row, addressDocs);
    if (bestAddress?.x && bestAddress?.y) {
      return { query: q, doc: bestAddress, source: "address" as const };
    }
  }

  return null;
}

async function markFailure(pool: ReturnType<typeof getDbPool>, row: QueueRow, message: string) {
  const permanent = row.attempts + 1 >= row.max_attempts;
  await pool.query(
    `
    UPDATE geocode_backfill_queue
    SET
      status = $2::VARCHAR,
      attempts = attempts + 1,
      last_error = $3,
      last_tried_at = NOW(),
      next_retry_at = CASE
        WHEN $2::VARCHAR = 'permanent_failed' THEN NOW()
        ELSE NOW() + (($4::INT + 1) * INTERVAL '10 minutes')
      END,
      updated_at = NOW()
    WHERE id = $1
    `,
    [row.task_id, permanent ? "permanent_failed" : "failed", message.slice(0, 1000), row.attempts]
  );
}

async function markSuccess(
  pool: ReturnType<typeof getDbPool>,
  row: QueueRow,
  lng: number,
  lat: number,
  confidence: number,
  source: "keyword" | "address"
) {
  await pool.query(
    `
    UPDATE complex
    SET
      location = ST_SetSRID(ST_MakePoint($2, $3), 4326),
      location_source = 'exact',
      geocode_confidence = $4,
      geocoded_at = NOW(),
      geocode_provider = $5
    WHERE id = $1
    `,
    [row.complex_id, lng, lat, confidence, `kakao-${source}`]
  );

  await pool.query(
    `
    UPDATE geocode_backfill_queue
    SET
      status = 'success',
      attempts = attempts + 1,
      last_error = NULL,
      last_tried_at = NOW(),
      next_retry_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
    `,
    [row.task_id]
  );
}

async function processOne(pool: ReturnType<typeof getDbPool>, row: QueueRow) {
  const selected = await findBestGeocode(row);

  if (!selected?.doc?.x || !selected?.doc?.y) {
    await markFailure(pool, row, `No geocode result for ${row.region_name} ${row.legal_dong} ${row.apt_name}`);
    return { ok: false as const, reason: "no_result" };
  }

  const lng = Number(selected.doc.x);
  const lat = Number(selected.doc.y);

  const reverseDoc = await kakaoCoordToAddress(lng, lat);
  const confidence = computeConfidence(row, selected.doc, reverseDoc);

  if (confidence < 0.6) {
    await markFailure(
      pool,
      row,
      `Reverse verification low confidence=${confidence} query=${selected.query} source=${selected.source}`
    );
    return { ok: false as const, reason: "low_confidence", confidence };
  }

  await markSuccess(pool, row, lng, lat, confidence, selected.source);
  return { ok: true as const, confidence, source: selected.source };
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
    ["system", null, "pipeline", null, `cron_geocode_maintain_${status}`, JSON.stringify(detail)]
  );
}

export async function GET(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      status = 503;
      return NextResponse.json({ ok: false, code: "CRON_SECRET_MISSING", error: "CRON_SECRET is not configured" }, { status });
    }

    if (!isAuthorized(req, cronSecret)) {
      status = 401;
      return NextResponse.json({ ok: false, code: "UNAUTHORIZED", error: "Invalid cron secret" }, { status });
    }

    if (!hasDatabaseUrl()) {
      status = 503;
      return NextResponse.json({ ok: false, code: "DB_NOT_CONFIGURED", error: "DATABASE_URL is not configured" }, { status });
    }

    if (!process.env.KAKAO_REST_API_KEY) {
      status = 503;
      return NextResponse.json({ ok: false, code: "KAKAO_REST_API_KEY_MISSING", error: "KAKAO_REST_API_KEY is not configured" }, { status });
    }

    const enqueueLimit = Number(process.env.GEOCODE_ENQUEUE_LIMIT ?? "300");
    const batch = Number(process.env.GEOCODE_CRON_BATCH ?? "15");

    const pool = getDbPool();

    await pool.query(
      `
      WITH picked AS (
        SELECT c.id AS complex_id
        FROM complex c
        WHERE c.location_source = 'approx'
        ORDER BY c.updated_at DESC, c.id DESC
        LIMIT $1
      )
      INSERT INTO geocode_backfill_queue (complex_id, status, attempts, max_attempts, next_retry_at, updated_at)
      SELECT p.complex_id, 'pending', 0, 5, NOW(), NOW()
      FROM picked p
      ON CONFLICT (complex_id) DO UPDATE
      SET
        status = CASE
          WHEN geocode_backfill_queue.status = 'success' THEN geocode_backfill_queue.status
          ELSE 'pending'
        END,
        next_retry_at = NOW(),
        updated_at = NOW()
      `,
      [enqueueLimit]
    );

    let processed = 0;
    let success = 0;
    let failed = 0;

    for (let i = 0; i < batch; i += 1) {
      const picked = await pool.query<QueueRow>(
        `
        SELECT
          q.id AS task_id,
          q.complex_id,
          q.attempts,
          q.max_attempts,
          c.apt_name,
          c.legal_dong,
          r.name_ko AS region_name
        FROM geocode_backfill_queue q
        JOIN complex c ON c.id = q.complex_id
        JOIN region r ON r.id = c.region_id
        WHERE q.status IN ('pending', 'failed')
          AND q.next_retry_at <= NOW()
        ORDER BY q.next_retry_at ASC, q.id ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
        `
      );

      if (picked.rowCount === 0) break;

      const row = picked.rows[0];
      const out = await processOne(pool, row);
      processed += 1;
      if (out.ok) success += 1;
      else failed += 1;
    }

    const metrics = await pool.query(
      `
      WITH s AS (
        SELECT
          COUNT(*)::INT AS total,
          COUNT(*) FILTER (WHERE location_source='exact')::INT AS exact,
          COUNT(*) FILTER (WHERE location_source='approx')::INT AS approx
        FROM complex
      ), q AS (
        SELECT
          COUNT(*) FILTER (WHERE status='pending')::INT AS pending,
          COUNT(*) FILTER (WHERE status='failed')::INT AS failed,
          COUNT(*) FILTER (WHERE status='success')::INT AS success,
          COUNT(*) FILTER (WHERE status='permanent_failed')::INT AS permanent_failed
        FROM geocode_backfill_queue
      )
      SELECT
        s.total,
        s.exact,
        s.approx,
        q.pending,
        q.failed,
        q.success,
        q.permanent_failed,
        COALESCE(ROUND((s.exact::NUMERIC / NULLIF(s.total,0)),4),0) AS exact_ratio,
        COALESCE(ROUND((q.failed::NUMERIC / NULLIF(s.total,0)),4),0) AS fail_ratio
      FROM s, q
      `
    );

    const m = metrics.rows[0] ?? {};
    const detail = {
      processed,
      success,
      failed,
      gate: {
        exactRatio: Number(m.exact_ratio ?? 0),
        failRatio: Number(m.fail_ratio ?? 0)
      },
      metric: {
        total: Number(m.total ?? 0),
        exact: Number(m.exact ?? 0),
        approx: Number(m.approx ?? 0),
        pending: Number(m.pending ?? 0),
        failed: Number(m.failed ?? 0),
        success: Number(m.success ?? 0),
        permanentFailed: Number(m.permanent_failed ?? 0)
      },
      ranAt: new Date().toISOString()
    };

    await writeCronAudit("success", detail);
    return NextResponse.json({ ok: true, ...detail });
  } catch (error) {
    logApiError("GET /api/cron/geocode-maintain", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = 500;

    try {
      await writeCronAudit("error", { message, ranAt: new Date().toISOString() });
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/cron/geocode-maintain", performance.now() - started, status);
  }
}