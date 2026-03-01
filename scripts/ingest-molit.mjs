import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const API_BASE = "https://apis.data.go.kr/1613000";
const TRADE_ENDPOINT = `${API_BASE}/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev`;

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

function parseArgs() {
  const argMap = new Map();
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.split("=");
    argMap.set(k.replace(/^--/, ""), v ?? "true");
  }

  const defaultRegions = ["11680", "11650", "11710", "11440", "11200", "11590", "11620", "11560", "11500", "11740"];
  const regions = (argMap.get("regions") ? argMap.get("regions").split(",") : defaultRegions).map((x) => x.trim());
  const months = Number(argMap.get("months") ?? "3");
  const maxPerRegion = Number(argMap.get("maxPerRegion") ?? "8000");
  const dryRun = argMap.get("dryRun") === "true";
  return { regions, months, maxPerRegion, dryRun };
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
  const dedupKey = [regionCode, aptName, legalDong, dealDate, dealAmount, areaM2, floor].join("|");

  return {
    aptName,
    legalDong,
    dealAmount,
    dealDate,
    areaM2,
    floor,
    buildYear,
    payload: {
      region_code: regionCode,
      apt_name: aptName,
      legal_dong: legalDong,
      deal_ymd: `${dealYear}${String(dealMonth).padStart(2, "0")}${String(dealDay).padStart(2, "0")}`,
      deal_amount_manwon: dealAmount,
      area_m2: areaM2,
      floor,
      build_year: buildYear
    },
    sourceHash: crypto.createHash("sha256").update(dedupKey).digest("hex")
  };
}

async function fetchDealsByMonth(regionCode, yyyymm) {
  const key = process.env.DATA_GO_KR_API_KEY;
  if (!key) throw new Error("Missing DATA_GO_KR_API_KEY");

  const all = [];
  let totalCount = 0;
  let pageNo = 1;
  const numOfRows = 1000;

  while (true) {
    const url = new URL(TRADE_ENDPOINT);
    url.searchParams.set("serviceKey", key);
    url.searchParams.set("LAWD_CD", regionCode);
    url.searchParams.set("DEAL_YMD", yyyymm);
    url.searchParams.set("numOfRows", String(numOfRows));
    url.searchParams.set("pageNo", String(pageNo));

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`MOLIT request failed (${regionCode}/${yyyymm}) status=${res.status}`);

    const xml = await res.text();
    const parsed = parseItems(xml);
    totalCount = parsed.totalCount;
    all.push(...parsed.items);

    if (all.length >= totalCount || parsed.items.length === 0) break;
    pageNo += 1;
  }

  return all;
}

async function main() {
  loadEnvLocal();
  const { regions, months, maxPerRegion, dryRun } = parseArgs();

  if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL in environment or .env.local");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });

  const regionIdCache = new Map();
  let totalRawInserted = 0;
  let totalNormInserted = 0;
  let totalDealsSeen = 0;

  try {
    const now = new Date();

    for (const regionCode of regions) {
      const meta = REGION_META[regionCode] ?? {
        sido: "unknown",
        sigungu: `code-${regionCode}`,
        nameKo: `지역 ${regionCode}`,
        center: { lat: 37.5665, lng: 126.978 }
      };

      let regionId = regionIdCache.get(regionCode);
      if (!regionId) {
        const regionRes = await pool.query(
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
        regionId = regionRes.rows[0].id;
        regionIdCache.set(regionCode, regionId);
      }

      const monthDeals = [];
      for (let i = 0; i < months; i += 1) {
        const yyyymm = monthKey(addMonths(now, -i));
        const fetched = await fetchDealsByMonth(regionCode, yyyymm);
        monthDeals.push(...fetched);
      }

      const normalizedDeals = monthDeals
        .map((raw) => normalizeDeal(raw, regionCode))
        .filter(Boolean)
        .slice(0, maxPerRegion);

      totalDealsSeen += normalizedDeals.length;

      console.log(`[ingest] region=${regionCode} fetched=${monthDeals.length} normalized=${normalizedDeals.length}`);

      if (dryRun) continue;

      for (const deal of normalizedDeals) {
        const lat = meta.center.lat + hashOffset(`${deal.aptName}|${deal.legalDong}|lat`);
        const lng = meta.center.lng + hashOffset(`${deal.aptName}|${deal.legalDong}|lng`);

        const complexRes = await pool.query(
          `
          INSERT INTO complex (
            region_id, external_key, apt_name, legal_dong, location, build_year, updated_at
          )
          VALUES (
            $1, $2, $3, $4,
            ST_SetSRID(ST_MakePoint($5, $6), 4326),
            $7,
            NOW()
          )
          ON CONFLICT (region_id, apt_name, legal_dong) DO UPDATE SET
            external_key = EXCLUDED.external_key,
            build_year = COALESCE(EXCLUDED.build_year, complex.build_year),
            location = COALESCE(complex.location, EXCLUDED.location),
            updated_at = NOW()
          RETURNING id
          `,
          [regionId, `${regionCode}-${deal.aptName}`.slice(0, 120), deal.aptName, deal.legalDong || "", lng, lat, deal.buildYear || null]
        );

        const complexId = complexRes.rows[0].id;

        const rawRes = await pool.query(
          `
          INSERT INTO deal_trade_raw (
            source_name, source_record_hash, region_code, deal_ymd, payload_json, complex_id
          )
          VALUES ($1, $2, $3, $4, $5::jsonb, $6)
          ON CONFLICT (source_record_hash) DO NOTHING
          RETURNING id
          `,
          ["molit", deal.sourceHash, regionCode, deal.payload.deal_ymd, JSON.stringify(deal.payload), complexId]
        );

        if (rawRes.rowCount > 0) totalRawInserted += 1;

        const normRes = await pool.query(
          `
          INSERT INTO deal_trade_normalized (
            complex_id, deal_date, deal_amount_manwon, area_m2, floor, build_year, source_raw_id
          )
          SELECT $1, $2::date, $3, $4, $5, $6, $7
          WHERE NOT EXISTS (
            SELECT 1
            FROM deal_trade_normalized n
            WHERE n.complex_id = $1
              AND n.deal_date = $2::date
              AND n.deal_amount_manwon = $3
              AND n.area_m2 = $4
              AND COALESCE(n.floor, -999) = COALESCE($5, -999)
          )
          `,
          [complexId, deal.dealDate, deal.dealAmount, deal.areaM2, deal.floor || null, deal.buildYear || null, rawRes.rows[0]?.id ?? null]
        );

        if (normRes.rowCount > 0) totalNormInserted += 1;
      }
    }

    console.log("[ingest] done", {
      regions: regions.length,
      months,
      totalDealsSeen,
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
