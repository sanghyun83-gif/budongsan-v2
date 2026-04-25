import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const API_BASE = "https://apis.data.go.kr/1613000";
const TRADE_ENDPOINT = `${API_BASE}/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev`;

// Some legacy city-level codes are now served as split codes in the MOLIT API.
const REGION_CODE_ALIASES = {
  "41590": ["41591", "41593", "41595", "41597"], // 화성
  "41190": ["41192", "41194", "41196"], // 부천
  "41170": ["41171", "41173"] // 안양
};

const REGION_META = {
  "11110": { sido: "seoul", sigungu: "jongno", nameKo: "종로구", center: { lat: 37.5729, lng: 126.9794 } },
  "11140": { sido: "seoul", sigungu: "jung", nameKo: "중구", center: { lat: 37.5638, lng: 126.9976 } },
  "11170": { sido: "seoul", sigungu: "yongsan", nameKo: "용산구", center: { lat: 37.5326, lng: 126.9905 } },
  "11200": { sido: "seoul", sigungu: "seongdong", nameKo: "성동구", center: { lat: 37.5633, lng: 127.0364 } },
  "11215": { sido: "seoul", sigungu: "gwangjin", nameKo: "광진구", center: { lat: 37.5384, lng: 127.0822 } },
  "11230": { sido: "seoul", sigungu: "dongdaemun", nameKo: "동대문구", center: { lat: 37.5744, lng: 127.0396 } },
  "11260": { sido: "seoul", sigungu: "jungnang", nameKo: "중랑구", center: { lat: 37.6066, lng: 127.0927 } },
  "11290": { sido: "seoul", sigungu: "seongbuk", nameKo: "성북구", center: { lat: 37.5894, lng: 127.0167 } },
  "11305": { sido: "seoul", sigungu: "gangbuk", nameKo: "강북구", center: { lat: 37.6396, lng: 127.0256 } },
  "11320": { sido: "seoul", sigungu: "dobong", nameKo: "도봉구", center: { lat: 37.6688, lng: 127.0471 } },
  "11350": { sido: "seoul", sigungu: "nowon", nameKo: "노원구", center: { lat: 37.6542, lng: 127.0568 } },
  "11380": { sido: "seoul", sigungu: "eunpyeong", nameKo: "은평구", center: { lat: 37.6028, lng: 126.9292 } },
  "11410": { sido: "seoul", sigungu: "seodaemun", nameKo: "서대문구", center: { lat: 37.5791, lng: 126.9368 } },
  "11440": { sido: "seoul", sigungu: "mapo", nameKo: "마포구", center: { lat: 37.5663, lng: 126.9019 } },
  "11470": { sido: "seoul", sigungu: "yangcheon", nameKo: "양천구", center: { lat: 37.5169, lng: 126.8664 } },
  "11500": { sido: "seoul", sigungu: "gangseo", nameKo: "강서구", center: { lat: 37.5509, lng: 126.8495 } },
  "11530": { sido: "seoul", sigungu: "guro", nameKo: "구로구", center: { lat: 37.4955, lng: 126.8874 } },
  "11545": { sido: "seoul", sigungu: "geumcheon", nameKo: "금천구", center: { lat: 37.4568, lng: 126.8956 } },
  "11560": { sido: "seoul", sigungu: "yeongdeungpo", nameKo: "영등포구", center: { lat: 37.5264, lng: 126.8962 } },
  "11590": { sido: "seoul", sigungu: "dongjak", nameKo: "동작구", center: { lat: 37.5124, lng: 126.9393 } },
  "11620": { sido: "seoul", sigungu: "gwanak", nameKo: "관악구", center: { lat: 37.4784, lng: 126.9516 } },
  "11650": { sido: "seoul", sigungu: "seocho", nameKo: "서초구", center: { lat: 37.4837, lng: 127.0324 } },
  "11680": { sido: "seoul", sigungu: "gangnam", nameKo: "강남구", center: { lat: 37.5172, lng: 127.0473 } },
  "11710": { sido: "seoul", sigungu: "songpa", nameKo: "송파구", center: { lat: 37.5145, lng: 127.1066 } },
  "11740": { sido: "seoul", sigungu: "gangdong", nameKo: "강동구", center: { lat: 37.5301, lng: 127.1238 } }
};

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

function parsePositiveInt(raw, fallback) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function parseNonNegativeInt(raw, fallback) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

function parseArgs() {
  const argMap = new Map();
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.split("=");
    argMap.set(k.replace(/^--/, ""), v ?? "true");
  }

  const defaultRegions = ["11680", "11650", "11710", "11440", "11200", "11590", "11620", "11560", "11500", "11740"];
  const requestedRegions = (argMap.get("regions") ? argMap.get("regions").split(",") : defaultRegions).map((x) => x.trim());
  const regions = [...new Set(requestedRegions.flatMap((code) => REGION_CODE_ALIASES[code] ?? [code]))];

  const months = parsePositiveInt(argMap.get("months") ?? "3", 3);
  const maxPerRegion = parseNonNegativeInt(argMap.get("maxPerRegion") ?? "0", 0);
  const dryRun = argMap.get("dryRun") === "true";
  const normalizeInline = argMap.get("normalizeInline") === "true";

  const regionConcurrency = parsePositiveInt(argMap.get("regionConcurrency") ?? "4", 4);
  const monthConcurrency = parsePositiveInt(argMap.get("monthConcurrency") ?? "3", 3);
  const fetchConcurrency = parsePositiveInt(argMap.get("fetchConcurrency") ?? "4", 4);
  const dbBatchSize = parsePositiveInt(argMap.get("dbBatchSize") ?? "1000", 1000);
  const retryMax = parsePositiveInt(argMap.get("retryMax") ?? "3", 3);

  const dealYmd = argMap.get("dealYmd");
  const startYmd = argMap.get("startYmd");
  const endYmd = argMap.get("endYmd");

  return {
    regions,
    requestedRegions,
    months,
    maxPerRegion,
    dryRun,
    normalizeInline,
    regionConcurrency,
    monthConcurrency,
    fetchConcurrency,
    dbBatchSize,
    retryMax,
    dealYmd,
    startYmd,
    endYmd
  };
}

function parseYmd(yyyymm) {
  if (!/^\d{6}$/.test(yyyymm)) return null;
  const year = Number(yyyymm.slice(0, 4));
  const month = Number(yyyymm.slice(4, 6));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  return new Date(year, month - 1, 1);
}

function toYmd(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildTargetMonths({ now, months, dealYmd, startYmd, endYmd }) {
  if (dealYmd) {
    const parsed = parseYmd(dealYmd);
    if (!parsed) throw new Error(`Invalid --dealYmd: ${dealYmd} (expected YYYYMM)`);
    return [dealYmd];
  }

  if (startYmd || endYmd) {
    if (!startYmd || !endYmd) {
      throw new Error("Both --startYmd and --endYmd are required together");
    }
    const start = parseYmd(startYmd);
    const end = parseYmd(endYmd);
    if (!start || !end) {
      throw new Error(`Invalid month range: start=${startYmd}, end=${endYmd} (expected YYYYMM)`);
    }
    if (start > end) {
      throw new Error(`Invalid month range: start=${startYmd} is after end=${endYmd}`);
    }

    const yyyymms = [];
    let cursor = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor >= start) {
      yyyymms.push(toYmd(cursor));
      cursor = addMonths(cursor, -1);
    }
    return yyyymms;
  }

  if (!Number.isInteger(months) || months <= 0) {
    throw new Error(`Invalid --months: ${months} (must be a positive integer)`);
  }

  const yyyymms = [];
  for (let i = 0; i < months; i += 1) {
    yyyymms.push(monthKey(addMonths(now, -i)));
  }
  return yyyymms;
}

function extract(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return m?.[1]?.trim();
}

function parseNumber(raw) {
  if (!raw) return 0;
  return Number(String(raw).replace(/,/g, "").trim()) || 0;
}

function parseItems(xml) {
  const resultCode = extract(xml, "resultCode");
  if (resultCode !== "00" && resultCode !== "000") {
    const resultMsg = extract(xml, "resultMsg") ?? "Unknown API error";
    throw new Error(`MOLIT API error ${resultCode}: ${resultMsg}`);
  }

  const totalCount = parseNumber(extract(xml, "totalCount"));
  const chunks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
  const items = chunks.map((chunk) => {
    const out = {};
    const matches = chunk.matchAll(/<([^>]+)>([^<]*)<\/\1>/g);
    for (const m of matches) out[m[1]] = m[2];
    return out;
  });

  return { totalCount, items };
}

function monthKey(date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(base, delta) {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

function hashOffset(input) {
  const h = crypto.createHash("sha256").update(input).digest("hex");
  const n = parseInt(h.slice(0, 8), 16);
  return (n / 0xffffffff - 0.5) * 0.1;
}

function normalizeDeal(raw, regionCode) {
  const aptName = (raw.aptNm ?? raw.아파트 ?? "").trim();
  if (!aptName) return null;

  const legalDong = (raw.umdNm ?? raw.법정동 ?? "").trim();
  const dealAmount = parseNumber(raw.dealAmount ?? raw.거래금액);
  const dealYear = parseNumber(raw.dealYear ?? raw.년);
  const dealMonth = parseNumber(raw.dealMonth ?? raw.월);
  const dealDay = parseNumber(raw.dealDay ?? raw.일);
  const areaM2 = Number(raw.excluUseAr ?? raw.전용면적 ?? "0") || 0;
  const floor = parseNumber(raw.floor ?? raw.층);
  const buildYear = parseNumber(raw.buildYear ?? raw.건축년도);

  if (!dealYear || !dealMonth || !dealDay || !dealAmount || !areaM2) return null;

  const dealDate = `${dealYear}-${String(dealMonth).padStart(2, "0")}-${String(dealDay).padStart(2, "0")}`;
  const dealYmd = `${dealYear}${String(dealMonth).padStart(2, "0")}${String(dealDay).padStart(2, "0")}`;
  const dedupKey = [regionCode, aptName, legalDong, dealDate, dealAmount, areaM2, floor].join("|");

  return {
    aptName,
    legalDong,
    dealAmount,
    dealDate,
    dealYmd,
    areaM2,
    floor,
    buildYear,
    payload: {
      region_code: regionCode,
      apt_name: aptName,
      legal_dong: legalDong,
      deal_ymd: dealYmd,
      deal_amount_manwon: dealAmount,
      area_m2: areaM2,
      floor,
      build_year: buildYear
    },
    sourceHash: crypto.createHash("sha256").update(dedupKey).digest("hex")
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchXmlPage(regionCode, yyyymm, pageNo, numOfRows, retryMax) {
  const key = process.env.DATA_GO_KR_API_KEY;
  if (!key) throw new Error("Missing DATA_GO_KR_API_KEY");

  let attempt = 0;
  while (true) {
    attempt += 1;
    const url = new URL(TRADE_ENDPOINT);
    url.searchParams.set("serviceKey", key);
    url.searchParams.set("LAWD_CD", regionCode);
    url.searchParams.set("DEAL_YMD", yyyymm);
    url.searchParams.set("numOfRows", String(numOfRows));
    url.searchParams.set("pageNo", String(pageNo));

    try {
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        if ((res.status === 429 || res.status >= 500) && attempt < retryMax) {
          const delay = 250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150);
          await sleep(delay);
          continue;
        }
        throw new Error(`MOLIT request failed (${regionCode}/${yyyymm}) page=${pageNo} status=${res.status}`);
      }
      return await res.text();
    } catch (error) {
      if (attempt >= retryMax) throw error;
      const delay = 250 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150);
      await sleep(delay);
    }
  }
}

async function pMapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor;
      cursor += 1;
      if (idx >= items.length) return;
      results[idx] = await mapper(items[idx], idx);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length || 1));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function fetchDealsByMonth(regionCode, yyyymm, fetchConcurrency, retryMax) {
  const numOfRows = 1000;

  const firstXml = await fetchXmlPage(regionCode, yyyymm, 1, numOfRows, retryMax);
  const firstParsed = parseItems(firstXml);
  const all = [...firstParsed.items];

  const totalPages = Math.ceil(firstParsed.totalCount / numOfRows);
  if (totalPages <= 1) return all;

  const restPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const pageItems = await pMapLimit(restPages, fetchConcurrency, async (pageNo) => {
    const xml = await fetchXmlPage(regionCode, yyyymm, pageNo, numOfRows, retryMax);
    const parsed = parseItems(xml);
    return parsed.items;
  });

  for (const items of pageItems) all.push(...items);
  return all;
}

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) chunks.push(items.slice(i, i + chunkSize));
  return chunks;
}

async function insertTempDeals(client, rows, chunkSize) {
  if (rows.length === 0) return;

  const chunks = chunkArray(rows, chunkSize);
  for (const chunk of chunks) {
    const values = [];
    const placeholders = [];

    for (let i = 0; i < chunk.length; i += 1) {
      const row = chunk[i];
      const base = i * 13;
      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}::date, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}::jsonb, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13})`
      );
      values.push(
        row.regionCode,
        row.aptName,
        row.legalDong,
        row.dealDate,
        row.dealYmd,
        row.dealAmount,
        row.areaM2,
        row.floor,
        JSON.stringify(row.payload),
        row.sourceHash,
        row.externalKey,
        row.lng,
        row.lat
      );
    }

    await client.query(
      `
      INSERT INTO temp_ingest_deals (
        region_code, apt_name, legal_dong, deal_date, deal_ymd,
        deal_amount_manwon, area_m2, floor, payload_json,
        source_hash, external_key, lng, lat
      )
      VALUES ${placeholders.join(",")}
      `,
      values
    );
  }
}

async function persistRegionDeals({ client, regionId, regionCode, meta, deals, dbBatchSize, normalizeInline }) {
  if (deals.length === 0) {
    return { rawInserted: 0, normInserted: 0 };
  }

  const stagedRows = deals.map((deal) => {
    const lat = meta.center.lat + hashOffset(`${deal.aptName}|${deal.legalDong}|lat`);
    const lng = meta.center.lng + hashOffset(`${deal.aptName}|${deal.legalDong}|lng`);
    return {
      regionCode,
      aptName: deal.aptName,
      legalDong: deal.legalDong || "",
      dealDate: deal.dealDate,
      dealYmd: deal.payload.deal_ymd,
      dealAmount: deal.dealAmount,
      areaM2: deal.areaM2,
      floor: deal.floor || null,
      payload: deal.payload,
      sourceHash: deal.sourceHash,
      externalKey: `${regionCode}-${deal.aptName}`.slice(0, 120),
      lng,
      lat
    };
  });

  await client.query("BEGIN");
  try {
    await client.query(
      `
      CREATE TEMP TABLE temp_ingest_deals (
        region_code VARCHAR(5) NOT NULL,
        apt_name VARCHAR(200) NOT NULL,
        legal_dong VARCHAR(120) NOT NULL,
        deal_date DATE NOT NULL,
        deal_ymd VARCHAR(8) NOT NULL,
        deal_amount_manwon INTEGER NOT NULL,
        area_m2 NUMERIC(8,2) NOT NULL,
        floor INTEGER,
        payload_json JSONB NOT NULL,
        source_hash CHAR(64) NOT NULL,
        external_key VARCHAR(120) NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        complex_id BIGINT
      ) ON COMMIT DROP
      `
    );

    await insertTempDeals(client, stagedRows, dbBatchSize);

    await client.query(
      `
      INSERT INTO complex (
        region_id, external_key, apt_name, legal_dong, location, build_year, updated_at
      )
      SELECT DISTINCT
        $1::bigint,
        t.external_key,
        t.apt_name,
        t.legal_dong,
        ST_SetSRID(ST_MakePoint(t.lng, t.lat), 4326),
        NULL::integer,
        NOW()
      FROM temp_ingest_deals t
      ON CONFLICT (region_id, apt_name, legal_dong) DO UPDATE SET
        external_key = EXCLUDED.external_key,
        location = COALESCE(complex.location, EXCLUDED.location),
        updated_at = NOW()
      `,
      [regionId]
    );

    await client.query(
      `
      UPDATE temp_ingest_deals t
      SET complex_id = c.id
      FROM complex c
      WHERE c.region_id = $1::bigint
        AND c.apt_name = t.apt_name
        AND c.legal_dong = t.legal_dong
      `,
      [regionId]
    );

    const rawInsertRes = await client.query(
      `
      WITH inserted AS (
        INSERT INTO deal_trade_raw (
          source_name, source_record_hash, region_code, deal_ymd, payload_json, complex_id
        )
        SELECT
          'molit',
          t.source_hash,
          t.region_code,
          t.deal_ymd,
          t.payload_json,
          t.complex_id
        FROM temp_ingest_deals t
        WHERE t.complex_id IS NOT NULL
        ON CONFLICT (source_record_hash) DO NOTHING
        RETURNING id
      )
      SELECT COUNT(*)::INT AS inserted_count FROM inserted
      `
    );

    let normInserted = 0;
    if (normalizeInline) {
      const normInsertRes = await client.query(
        `
        WITH inserted AS (
          INSERT INTO deal_trade_normalized (
            complex_id, deal_date, deal_amount_manwon, area_m2, floor, build_year, source_raw_id
          )
          SELECT
            t.complex_id,
            t.deal_date,
            t.deal_amount_manwon,
            t.area_m2,
            t.floor,
            NULL,
            r.id
          FROM temp_ingest_deals t
          JOIN deal_trade_raw r ON r.source_record_hash = t.source_hash
          WHERE t.complex_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM deal_trade_normalized n
              WHERE n.source_raw_id = r.id
            )
          RETURNING id
        )
        SELECT COUNT(*)::INT AS inserted_count FROM inserted
        `
      );
      normInserted = normInsertRes.rows[0]?.inserted_count ?? 0;
    }

    await client.query("COMMIT");

    return {
      rawInserted: rawInsertRes.rows[0]?.inserted_count ?? 0,
      normInserted
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function processRegion({ pool, regionCode, targetMonths, monthConcurrency, fetchConcurrency, retryMax, maxPerRegion, dryRun, dbBatchSize, normalizeInline }) {
  const startedAt = Date.now();
  const meta = REGION_META[regionCode] ?? {
    sido: "unknown",
    sigungu: `code-${regionCode}`,
    nameKo: `지역 ${regionCode}`,
    center: { lat: 37.5665, lng: 126.978 }
  };

  const monthResults = await pMapLimit(targetMonths, monthConcurrency, async (yyyymm) => {
    const monthStartedAt = Date.now();
    const fetched = await fetchDealsByMonth(regionCode, yyyymm, fetchConcurrency, retryMax);
    console.log(
      `[ingest] region=${regionCode} month=${yyyymm} fetched=${fetched.length} durationMs=${Date.now() - monthStartedAt}`
    );
    return fetched;
  });

  const monthDeals = monthResults.flat();
  const normalizedDeals = [];
  for (const raw of monthDeals) {
    const normalized = normalizeDeal(raw, regionCode);
    if (normalized) normalizedDeals.push(normalized);
  }

  const limitedDeals = maxPerRegion > 0 ? normalizedDeals.slice(0, maxPerRegion) : normalizedDeals;
  const totalDealsSeen = limitedDeals.length;

  console.log(
    `[ingest] region=${regionCode} fetched=${monthDeals.length} normalized=${normalizedDeals.length} selected=${totalDealsSeen} maxPerRegion=${maxPerRegion || "unlimited"}`
  );

  if (dryRun) {
    return {
      regionCode,
      totalDealsSeen,
      rawInserted: 0,
      normInserted: 0,
      durationMs: Date.now() - startedAt
    };
  }

  const client = await pool.connect();
  try {
    const regionRes = await client.query(
      `
      INSERT INTO region (code, sido, sigungu, name_ko)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (code) DO UPDATE SET
        sido = EXCLUDED.sido,
        sigungu = EXCLUDED.sigungu,
        name_ko = EXCLUDED.name_ko
      RETURNING id
      `,
      [regionCode, meta.sido, meta.sigungu, meta.nameKo]
    );

    const regionId = Number(regionRes.rows[0].id);
    const writeResult = await persistRegionDeals({
      client,
      regionId,
      regionCode,
      meta,
      deals: limitedDeals,
      dbBatchSize,
      normalizeInline
    });

    return {
      regionCode,
      totalDealsSeen,
      rawInserted: writeResult.rawInserted,
      normInserted: writeResult.normInserted,
      durationMs: Date.now() - startedAt
    };
  } finally {
    client.release();
  }
}

async function main() {
  loadEnvLocal();
  const {
    regions,
    requestedRegions,
    months,
    maxPerRegion,
    dryRun,
    normalizeInline,
    regionConcurrency,
    monthConcurrency,
    fetchConcurrency,
    dbBatchSize,
    retryMax,
    dealYmd,
    startYmd,
    endYmd
  } = parseArgs();

  if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL in environment or .env.local");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    max: Math.max(10, regionConcurrency * 2 + 2)
  });

  try {
    const now = new Date();
    const targetMonths = buildTargetMonths({ now, months, dealYmd, startYmd, endYmd });
    if (requestedRegions.join(",") !== regions.join(",")) {
      console.log(`[ingest] expanded regions: requested=${requestedRegions.join(",")} resolved=${regions.join(",")}`);
    }

    console.log(
      `[ingest] options regionConcurrency=${regionConcurrency} monthConcurrency=${monthConcurrency} fetchConcurrency=${fetchConcurrency} dbBatchSize=${dbBatchSize} maxPerRegion=${maxPerRegion || "unlimited"} normalizeInline=${normalizeInline} retryMax=${retryMax}`
    );

    const perRegion = await pMapLimit(regions, regionConcurrency, async (regionCode) => {
      try {
        return await processRegion({
          pool,
          regionCode,
          targetMonths,
          monthConcurrency,
          fetchConcurrency,
          retryMax,
          maxPerRegion,
          dryRun,
          dbBatchSize,
          normalizeInline
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[ingest] region=${regionCode} failed error=${message}`);
        throw error;
      }
    });

    const totalDealsSeen = perRegion.reduce((acc, cur) => acc + cur.totalDealsSeen, 0);
    const totalRawInserted = perRegion.reduce((acc, cur) => acc + cur.rawInserted, 0);
    const totalNormInserted = perRegion.reduce((acc, cur) => acc + cur.normInserted, 0);

    for (const item of perRegion) {
      console.log(
        `[ingest] region-summary region=${item.regionCode} deals=${item.totalDealsSeen} rawInserted=${item.rawInserted} normInserted=${item.normInserted} durationMs=${item.durationMs}`
      );
    }

    console.log("[ingest] done", {
      regions: regions.length,
      months: targetMonths.length,
      monthRange: {
        newest: targetMonths[0],
        oldest: targetMonths[targetMonths.length - 1]
      },
      totalDealsSeen,
      totalRawInserted,
      totalNormInserted,
      dryRun,
      normalizeInline
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
