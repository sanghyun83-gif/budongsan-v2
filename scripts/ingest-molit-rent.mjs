import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const API_BASE = "https://apis.data.go.kr/1613000";
const RENT_ENDPOINT = `${API_BASE}/RTMSDataSvcAptRent/getRTMSDataSvcAptRent`;

const REGION_CODE_ALIASES = {
  "41590": ["41591", "41593", "41595", "41597"],
  "41190": ["41192", "41194", "41196"],
  "41170": ["41171", "41173"]
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

function parseArgs() {
  const argMap = new Map();
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.split("=");
    argMap.set(k.replace(/^--/, ""), v ?? "true");
  }

  const defaultRegions = Object.keys(REGION_META);
  const requestedRegions = (argMap.get("regions") ? argMap.get("regions").split(",") : defaultRegions).map((x) => x.trim());
  const regions = [...new Set(requestedRegions.flatMap((code) => REGION_CODE_ALIASES[code] ?? [code]))];

  const months = parsePositiveInt(argMap.get("months") ?? "3", 3);
  const dryRun = argMap.get("dryRun") === "true";
  const regionConcurrency = parsePositiveInt(argMap.get("regionConcurrency") ?? "4", 4);
  const monthConcurrency = parsePositiveInt(argMap.get("monthConcurrency") ?? "3", 3);
  const fetchConcurrency = parsePositiveInt(argMap.get("fetchConcurrency") ?? "4", 4);
  const dbBatchSize = parsePositiveInt(argMap.get("dbBatchSize") ?? "1000", 1000);
  const retryMax = parsePositiveInt(argMap.get("retryMax") ?? "3", 3);

  return {
    regions,
    months,
    dryRun,
    regionConcurrency,
    monthConcurrency,
    fetchConcurrency,
    dbBatchSize,
    retryMax,
    dealYmd: argMap.get("dealYmd"),
    startYmd: argMap.get("startYmd"),
    endYmd: argMap.get("endYmd")
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

function addMonths(base, delta) {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

function buildTargetMonths({ now, months, dealYmd, startYmd, endYmd }) {
  if (dealYmd) {
    const parsed = parseYmd(dealYmd);
    if (!parsed) throw new Error(`Invalid --dealYmd: ${dealYmd}`);
    return [dealYmd];
  }
  if (startYmd || endYmd) {
    if (!startYmd || !endYmd) throw new Error("Both --startYmd and --endYmd are required");
    const start = parseYmd(startYmd);
    const end = parseYmd(endYmd);
    if (!start || !end || start > end) throw new Error(`Invalid range: ${startYmd}~${endYmd}`);
    const out = [];
    let cursor = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor >= start) {
      out.push(toYmd(cursor));
      cursor = addMonths(cursor, -1);
    }
    return out;
  }
  return Array.from({ length: months }, (_, i) => toYmd(addMonths(now, -i)));
}

function parseNumber(raw) {
  if (!raw) return 0;
  return Number(String(raw).replace(/,/g, "").trim()) || 0;
}

function extract(xml, tag) {
  const a = `<${tag}>`;
  const b = `</${tag}>`;
  const i = xml.indexOf(a);
  if (i < 0) return "";
  const j = xml.indexOf(b, i + a.length);
  if (j < 0) return "";
  return xml.slice(i + a.length, j).trim();
}

function parseItems(xml) {
  const resultCode = extract(xml, "resultCode");
  if (resultCode !== "00" && resultCode !== "000") {
    throw new Error(`MOLIT rent API error ${resultCode}: ${extract(xml, "resultMsg")}`);
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

function hashOffset(input) {
  const h = crypto.createHash("sha256").update(input).digest("hex");
  const n = parseInt(h.slice(0, 8), 16);
  return (n / 0xffffffff - 0.5) * 0.1;
}

function normalizeRent(raw, regionCode) {
  const aptName = (raw.aptNm ?? "").trim();
  if (!aptName) return null;

  const legalDong = (raw.umdNm ?? "").trim();
  const dealYear = parseNumber(raw.dealYear ?? raw.년);
  const dealMonth = parseNumber(raw.dealMonth ?? raw.월);
  const dealDay = parseNumber(raw.dealDay ?? raw.일);
  const areaM2 = Number(raw.excluUseAr ?? raw.전용면적 ?? "0") || 0;
  const floor = parseNumber(raw.floor ?? raw.층);
  const buildYear = parseNumber(raw.buildYear ?? raw.건축년도);
  const deposit = parseNumber(raw.deposit ?? raw.보증금액);
  const monthlyRent = parseNumber(raw.monthlyRent ?? raw.월세금액);
  if (!dealYear || !dealMonth || !dealDay || !areaM2 || (!deposit && !monthlyRent)) return null;

  const dealDate = `${dealYear}-${String(dealMonth).padStart(2, "0")}-${String(dealDay).padStart(2, "0")}`;
  const dealYmd = `${dealYear}${String(dealMonth).padStart(2, "0")}${String(dealDay).padStart(2, "0")}`;
  const rentType = monthlyRent > 0 ? "wolse" : "jeonse";
  const dedupKey = [regionCode, aptName, legalDong, dealDate, areaM2, floor, deposit, monthlyRent, rentType].join("|");

  return {
    aptName,
    legalDong,
    dealDate,
    dealYmd,
    areaM2,
    floor,
    buildYear,
    deposit,
    monthlyRent,
    rentType,
    payload: {
      region_code: regionCode,
      apt_name: aptName,
      legal_dong: legalDong,
      deal_ymd: dealYmd,
      area_m2: areaM2,
      floor,
      build_year: buildYear,
      deposit_manwon: deposit,
      monthly_rent_manwon: monthlyRent,
      rent_type: rentType
    },
    sourceHash: crypto.createHash("sha256").update(dedupKey).digest("hex")
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pMapLimit(items, limit, mapper) {
  const out = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (true) {
      const cur = idx;
      idx += 1;
      if (cur >= items.length) return;
      out[cur] = await mapper(items[cur], cur);
    }
  }
  const workers = Math.max(1, Math.min(limit, items.length || 1));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return out;
}

async function fetchXmlPage(regionCode, yyyymm, pageNo, numOfRows, retryMax) {
  const key = process.env.DATA_GO_KR_API_KEY;
  if (!key) throw new Error("Missing DATA_GO_KR_API_KEY");

  let attempt = 0;
  while (true) {
    attempt += 1;
    const url = new URL(RENT_ENDPOINT);
    url.searchParams.set("serviceKey", key);
    url.searchParams.set("LAWD_CD", regionCode);
    url.searchParams.set("DEAL_YMD", yyyymm);
    url.searchParams.set("numOfRows", String(numOfRows));
    url.searchParams.set("pageNo", String(pageNo));

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.ok) return res.text();

    if ((res.status === 429 || res.status >= 500) && attempt < retryMax) {
      await sleep(250 * 2 ** (attempt - 1));
      continue;
    }
    throw new Error(`MOLIT rent request failed (${regionCode}/${yyyymm}) page=${pageNo} status=${res.status}`);
  }
}

async function fetchRentsByMonth(regionCode, yyyymm, fetchConcurrency, retryMax) {
  const numOfRows = 1000;
  const first = parseItems(await fetchXmlPage(regionCode, yyyymm, 1, numOfRows, retryMax));
  const all = [...first.items];
  const totalPages = Math.ceil(first.totalCount / numOfRows);
  if (totalPages <= 1) return all;

  const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const chunks = await pMapLimit(pages, fetchConcurrency, async (pageNo) => {
    const parsed = parseItems(await fetchXmlPage(regionCode, yyyymm, pageNo, numOfRows, retryMax));
    return parsed.items;
  });
  for (const items of chunks) all.push(...items);
  return all;
}

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) chunks.push(items.slice(i, i + chunkSize));
  return chunks;
}

async function insertTempRents(client, rows, batchSize) {
  const chunks = chunkArray(rows, batchSize);
  for (const chunk of chunks) {
    const values = [];
    const placeholders = [];
    for (let i = 0; i < chunk.length; i += 1) {
      const r = chunk[i];
      const base = i * 15;
      placeholders.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4}::date,$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12}::jsonb,$${base + 13},$${base + 14},$${base + 15})`);
      values.push(
        r.regionCode,
        r.aptName,
        r.legalDong,
        r.dealDate,
        r.dealYmd,
        r.areaM2,
        r.floor,
        r.buildYear,
        r.deposit,
        r.monthlyRent,
        r.rentType,
        JSON.stringify(r.payload),
        r.sourceHash,
        r.lng,
        r.lat
      );
    }

    await client.query(
      `INSERT INTO temp_ingest_rent (
        region_code, apt_name, legal_dong, deal_date, deal_ymd,
        area_m2, floor, build_year, deposit_manwon, monthly_rent_manwon,
        rent_type, payload_json, source_hash, lng, lat
      ) VALUES ${placeholders.join(",")}`,
      values
    );
  }
}

async function persistRegionRents({ client, regionId, regionCode, meta, rents, dbBatchSize }) {
  if (rents.length === 0) return { rawInserted: 0, normInserted: 0 };

  const rows = rents.map((rent) => {
    const lat = meta.center.lat + hashOffset(`${rent.aptName}|${rent.legalDong}|lat`);
    const lng = meta.center.lng + hashOffset(`${rent.aptName}|${rent.legalDong}|lng`);
    return {
      regionCode,
      aptName: rent.aptName,
      legalDong: rent.legalDong || "",
      dealDate: rent.dealDate,
      dealYmd: rent.dealYmd,
      areaM2: rent.areaM2,
      floor: rent.floor || null,
      buildYear: rent.buildYear || null,
      deposit: rent.deposit,
      monthlyRent: rent.monthlyRent,
      rentType: rent.rentType,
      payload: rent.payload,
      sourceHash: rent.sourceHash,
      lng,
      lat
    };
  });

  await client.query("BEGIN");
  try {
    await client.query(`
      CREATE TEMP TABLE temp_ingest_rent (
        region_code VARCHAR(5) NOT NULL,
        apt_name VARCHAR(200) NOT NULL,
        legal_dong VARCHAR(120) NOT NULL,
        deal_date DATE NOT NULL,
        deal_ymd VARCHAR(8) NOT NULL,
        area_m2 NUMERIC(8,2) NOT NULL,
        floor INTEGER,
        build_year INTEGER,
        deposit_manwon INTEGER NOT NULL,
        monthly_rent_manwon INTEGER NOT NULL,
        rent_type VARCHAR(10) NOT NULL,
        payload_json JSONB NOT NULL,
        source_hash CHAR(64) NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        complex_id BIGINT
      ) ON COMMIT DROP
    `);

    await insertTempRents(client, rows, dbBatchSize);

    await client.query(
      `
      WITH dedup AS (
        SELECT DISTINCT ON (t.apt_name, t.legal_dong)
          t.region_code,
          t.apt_name,
          t.legal_dong,
          t.lng,
          t.lat,
          t.build_year
        FROM temp_ingest_rent t
        ORDER BY t.apt_name, t.legal_dong, t.deal_date DESC
      )
      INSERT INTO complex (
        region_id, external_key, apt_name, legal_dong, location, build_year, updated_at
      )
      SELECT
        $1::bigint,
        LEFT(d.region_code || '-' || d.apt_name, 120),
        d.apt_name,
        d.legal_dong,
        ST_SetSRID(ST_MakePoint(d.lng, d.lat), 4326),
        d.build_year,
        NOW()
      FROM dedup d
      ON CONFLICT (region_id, apt_name, legal_dong) DO UPDATE SET
        build_year = COALESCE(EXCLUDED.build_year, complex.build_year),
        location = COALESCE(complex.location, EXCLUDED.location),
        updated_at = NOW()
      `,
      [regionId]
    );

    await client.query(
      `
      UPDATE temp_ingest_rent t
      SET complex_id = c.id
      FROM complex c
      WHERE c.region_id = $1::bigint
        AND c.apt_name = t.apt_name
        AND c.legal_dong = t.legal_dong
      `,
      [regionId]
    );

    const rawRes = await client.query(`
      WITH inserted AS (
        INSERT INTO deal_rent_raw (source_name, source_record_hash, region_code, deal_ymd, payload_json, complex_id)
        SELECT 'molit_rent', t.source_hash, t.region_code, t.deal_ymd, t.payload_json, t.complex_id
        FROM temp_ingest_rent t
        WHERE t.complex_id IS NOT NULL
        ON CONFLICT (source_record_hash) DO NOTHING
        RETURNING id
      )
      SELECT COUNT(*)::int AS inserted_count FROM inserted
    `);

    const normRes = await client.query(`
      WITH src AS (
        SELECT DISTINCT ON (r.id)
          t.complex_id,
          t.deal_date,
          t.rent_type,
          t.deposit_manwon,
          t.monthly_rent_manwon,
          t.area_m2,
          t.floor,
          t.build_year,
          r.id AS source_raw_id
        FROM temp_ingest_rent t
        JOIN deal_rent_raw r ON r.source_record_hash = t.source_hash
        WHERE t.complex_id IS NOT NULL
        ORDER BY r.id, t.deal_date DESC
      ),
      inserted AS (
        INSERT INTO deal_rent_normalized (
          complex_id, deal_date, rent_type, deposit_manwon, monthly_rent_manwon,
          area_m2, floor, build_year, source_raw_id
        )
        SELECT
          s.complex_id,
          s.deal_date,
          s.rent_type,
          s.deposit_manwon,
          s.monthly_rent_manwon,
          s.area_m2,
          s.floor,
          s.build_year,
          s.source_raw_id
        FROM src s
        WHERE NOT EXISTS (
          SELECT 1 FROM deal_rent_normalized n WHERE n.source_raw_id = s.source_raw_id
        )
        RETURNING id
      )
      SELECT COUNT(*)::int AS inserted_count FROM inserted
    `);

    await client.query("COMMIT");
    return {
      rawInserted: Number(rawRes.rows[0]?.inserted_count ?? 0),
      normInserted: Number(normRes.rows[0]?.inserted_count ?? 0)
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function processRegion({ pool, regionCode, targetMonths, monthConcurrency, fetchConcurrency, retryMax, dryRun, dbBatchSize }) {
  const startedAt = Date.now();
  const meta = REGION_META[regionCode] ?? {
    sido: "unknown",
    sigungu: `code-${regionCode}`,
    nameKo: `지역 ${regionCode}`,
    center: { lat: 37.5665, lng: 126.978 }
  };

  const monthResults = await pMapLimit(targetMonths, monthConcurrency, async (yyyymm) => {
    const started = Date.now();
    const fetched = await fetchRentsByMonth(regionCode, yyyymm, fetchConcurrency, retryMax);
    console.log(`[rent-ingest] region=${regionCode} month=${yyyymm} fetched=${fetched.length} durationMs=${Date.now() - started}`);
    return fetched;
  });

  const monthRents = monthResults.flat();
  const normalizedRents = monthRents.map((raw) => normalizeRent(raw, regionCode)).filter(Boolean);

  console.log(`[rent-ingest] region=${regionCode} fetched=${monthRents.length} normalized=${normalizedRents.length}`);
  if (dryRun) {
    return { regionCode, totalSeen: normalizedRents.length, rawInserted: 0, normInserted: 0, durationMs: Date.now() - startedAt };
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

    const result = await persistRegionRents({
      client,
      regionId: Number(regionRes.rows[0].id),
      regionCode,
      meta,
      rents: normalizedRents,
      dbBatchSize
    });

    return {
      regionCode,
      totalSeen: normalizedRents.length,
      rawInserted: result.rawInserted,
      normInserted: result.normInserted,
      durationMs: Date.now() - startedAt
    };
  } finally {
    client.release();
  }
}

async function main() {
  loadEnvLocal();
  const { regions, months, dryRun, regionConcurrency, monthConcurrency, fetchConcurrency, dbBatchSize, retryMax, dealYmd, startYmd, endYmd } = parseArgs();

  if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    max: Math.max(10, regionConcurrency * 2 + 2)
  });

  try {
    const targetMonths = buildTargetMonths({ now: new Date(), months, dealYmd, startYmd, endYmd });
    console.log(`[rent-ingest] options regionConcurrency=${regionConcurrency} monthConcurrency=${monthConcurrency} fetchConcurrency=${fetchConcurrency} dbBatchSize=${dbBatchSize} retryMax=${retryMax}`);

    const perRegion = await pMapLimit(regions, regionConcurrency, (regionCode) =>
      processRegion({ pool, regionCode, targetMonths, monthConcurrency, fetchConcurrency, retryMax, dryRun, dbBatchSize })
    );

    const totalSeen = perRegion.reduce((a, b) => a + b.totalSeen, 0);
    const totalRawInserted = perRegion.reduce((a, b) => a + b.rawInserted, 0);
    const totalNormInserted = perRegion.reduce((a, b) => a + b.normInserted, 0);

    for (const row of perRegion) {
      console.log(`[rent-ingest] region-summary region=${row.regionCode} seen=${row.totalSeen} rawInserted=${row.rawInserted} normInserted=${row.normInserted} durationMs=${row.durationMs}`);
    }

    console.log("[rent-ingest] done", {
      regions: regions.length,
      months: targetMonths.length,
      monthRange: { newest: targetMonths[0], oldest: targetMonths[targetMonths.length - 1] },
      totalSeen,
      totalRawInserted,
      totalNormInserted,
      dryRun
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
