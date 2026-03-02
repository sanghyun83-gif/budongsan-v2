import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

function parseArgs() {
  const argMap = new Map();
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.split("=");
    argMap.set(k.replace(/^--/, ""), v ?? "true");
  }

  return {
    batch: Number(argMap.get("batch") ?? "100")
  };
}

function assertEnv() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in environment or .env.local");
  }
  if (!process.env.KAKAO_REST_API_KEY) {
    throw new Error("Missing KAKAO_REST_API_KEY in environment or .env.local");
  }
}

function authHeaders() {
  return { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` };
}

async function kakaoKeywordSearch(query) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("size", "10");

  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`Kakao keyword search failed: ${res.status}`);
  }

  const json = await res.json();
  return json.documents ?? [];
}

async function kakaoAddressSearch(query) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
  url.searchParams.set("query", query);
  url.searchParams.set("analyze_type", "similar");
  url.searchParams.set("size", "10");

  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`Kakao address search failed: ${res.status}`);
  }

  const json = await res.json();
  return json.documents ?? [];
}

async function kakaoCoordToAddress(lng, lat) {
  const url = new URL("https://dapi.kakao.com/v2/local/geo/coord2address.json");
  url.searchParams.set("x", String(lng));
  url.searchParams.set("y", String(lat));

  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`Kakao reverse geocode failed: ${res.status}`);
  }

  const json = await res.json();
  return (json.documents ?? [])[0] ?? null;
}

function normalizeText(s) {
  return String(s ?? "").trim();
}

function normalizeDong(s) {
  return normalizeText(s).replace(/\([^)]*\)/g, "").replace(/\d+媛/g, "媛").replace(/\s+/g, "");
}

function normalizeAptName(name) {
  const n = normalizeText(name)
    .replace(/\([^)]*\)/g, " ")
    .replace(/[\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return n;
}

function buildQueryCandidates(row) {
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

function pickBestDoc(row, docs) {
  if (!docs || docs.length === 0) return null;

  const targetDong = normalizeDong(row.legal_dong);
  const targetRegion = normalizeText(row.region_name);
  const targetApt = normalizeAptName(row.apt_name).replace(/\s+/g, "");

  let best = null;
  let bestScore = -1;

  for (const d of docs) {
    const text = [
      d.place_name,
      d.address_name,
      d.road_address_name,
      d.address?.address_name,
      d.address?.region_2depth_name,
      d.address?.region_3depth_name,
      d.road_address?.address_name,
      d.road_address?.region_2depth_name,
      d.road_address?.region_3depth_name
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

function computeConfidence(row, selectedDoc, reverseDoc) {
  let score = 0;

  const targetDong = normalizeDong(row.legal_dong);
  const targetRegion = normalizeText(row.region_name);

  const docText = [
    selectedDoc?.place_name,
    selectedDoc?.address_name,
    selectedDoc?.road_address_name,
    selectedDoc?.address?.address_name,
    selectedDoc?.address?.region_2depth_name,
    selectedDoc?.address?.region_3depth_name,
    selectedDoc?.road_address?.address_name,
    selectedDoc?.road_address?.region_2depth_name,
    selectedDoc?.road_address?.region_3depth_name
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, "");

  const reverseText = [
    reverseDoc?.address?.address_name,
    reverseDoc?.address?.region_2depth_name,
    reverseDoc?.address?.region_3depth_name,
    reverseDoc?.road_address?.address_name,
    reverseDoc?.road_address?.region_2depth_name,
    reverseDoc?.road_address?.region_3depth_name
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

async function findBestGeocode(row) {
  const candidates = buildQueryCandidates(row);

  for (const q of candidates) {
    const keywordDocs = await kakaoKeywordSearch(q);
    const bestKeyword = pickBestDoc(row, keywordDocs);
    if (bestKeyword?.x && bestKeyword?.y) {
      return { query: q, doc: bestKeyword, source: "keyword" };
    }

    const addressDocs = await kakaoAddressSearch(q);
    const bestAddress = pickBestDoc(row, addressDocs);
    if (bestAddress?.x && bestAddress?.y) {
      return { query: q, doc: bestAddress, source: "address" };
    }
  }

  return null;
}

async function markFailure(client, taskId, attempts, maxAttempts, message) {
  const permanent = attempts + 1 >= maxAttempts;
  await client.query(
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
    [taskId, permanent ? "permanent_failed" : "failed", message.slice(0, 1000), attempts]
  );
}

async function markSuccess(client, row, lng, lat, confidence, source) {
  await client.query(
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

  await client.query(
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

async function processOne(client, row) {
  const selected = await findBestGeocode(row);

  if (!selected?.doc?.x || !selected?.doc?.y) {
    await markFailure(client, row.task_id, row.attempts, row.max_attempts, `No geocode result for ${row.region_name} ${row.legal_dong} ${row.apt_name}`);
    return { ok: false, reason: "no_result" };
  }

  const lng = Number(selected.doc.x);
  const lat = Number(selected.doc.y);

  const reverseDoc = await kakaoCoordToAddress(lng, lat);
  const confidence = computeConfidence(row, selected.doc, reverseDoc);

  if (confidence < 0.6) {
    await markFailure(
      client,
      row.task_id,
      row.attempts,
      row.max_attempts,
      `Reverse verification low confidence=${confidence} query=${selected.query} source=${selected.source}`
    );
    return { ok: false, reason: "low_confidence", confidence };
  }

  await markSuccess(client, row, lng, lat, confidence, selected.source);
  return { ok: true, confidence, source: selected.source };
}

async function main() {
  loadEnvLocal();
  assertEnv();

  const { batch } = parseArgs();

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });

  let processed = 0;
  let success = 0;
  let failed = 0;

  try {
    for (let i = 0; i < batch; i += 1) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const picked = await client.query(
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

        if (picked.rowCount === 0) {
          await client.query("ROLLBACK");
          client.release();
          break;
        }

        const row = picked.rows[0];
        const out = await processOne(client, row);

        processed += 1;
        if (out.ok) success += 1;
        else failed += 1;

        await client.query("COMMIT");
        client.release();
      } catch (err) {
        await client.query("ROLLBACK");
        client.release();
        throw err;
      }
    }

    console.log("[geocode:backfill] done", { batch, processed, success, failed });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});