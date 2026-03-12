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
    prefix: argMap.get("prefix") ?? "41",
    title: argMap.get("title") ?? "GYEONGGI",
    out: argMap.get("out"),
    startYmd: argMap.get("startYmd") ?? "202503",
    endYmd: argMap.get("endYmd") ?? "202602",
    targetLabel: argMap.get("targetLabel") ?? "경기도 41xxx 중 12개월 미만 커버리지"
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

function buildMonths(startYmd, endYmd) {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  if (!start || !end) throw new Error(`Invalid range: ${startYmd} ~ ${endYmd}`);
  if (start > end) throw new Error(`Invalid range: start ${startYmd} > end ${endYmd}`);

  const months = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    months.push(toYmd(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return months;
}

const REGION_NAME_OVERRIDES = {
  // Gyeonggi (41xxx)
  "41111": "수원시 장안구",
  "41113": "수원시 권선구",
  "41115": "수원시 팔달구",
  "41117": "수원시 영통구",
  "41131": "성남시 수정구",
  "41133": "성남시 중원구",
  "41135": "성남시 분당구",
  "41170": "안양시",
  "41171": "안양시 만안구",
  "41173": "안양시 동안구",
  "41190": "부천시",
  "41192": "부천시 원미구",
  "41194": "부천시 소사구",
  "41196": "부천시 오정구",
  "41220": "평택시",
  "41281": "고양시 덕양구",
  "41285": "고양시 일산동구",
  "41287": "고양시 일산서구",
  "41360": "남양주시",
  "41461": "용인시 수지구",
  "41463": "용인시 기흥구",
  "41465": "용인시 처인구",
  "41590": "화성시(통합)",
  "41591": "화성시(향남/남양)",
  "41593": "화성시(봉담/정남)",
  "41595": "화성시(병점/진안)",
  "41597": "화성시(동탄)"
};

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildMd({ title, startYmd, endYmd, targetLabel, groups, completed, reportDate }) {
  const lines = [];
  lines.push(`# ${title}_COVERAGE_PRIORITY_${reportDate}`);
  lines.push("");
  lines.push(`- 기준 범위: ${startYmd}~${endYmd} (최근 12개월, 전월 기준)`);
  lines.push("- 기준: missing_months 내림차순, 동률이면 total_raw 내림차순");
  lines.push(`- 대상: ${targetLabel}`);
  lines.push("");

  for (const [missing, items] of groups) {
    lines.push(`## Priority (missing ${missing}개월 그룹)`);
    if (items.length === 0) {
      lines.push("None");
      lines.push("");
      continue;
    }
    items.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.region_code} ${item.name_ko}`);
    });
    lines.push("");
  }

  lines.push("## 완료(12개월 커버)");
  if (completed.length === 0) {
    lines.push("None");
  } else {
    completed.forEach((item) => {
      lines.push(`- ${item.region_code} ${item.name_ko}`);
    });
  }
  lines.push("");
  return lines.join("\n");
}

async function main() {
  loadEnvLocal();
  const { prefix, title, out, startYmd, endYmd, targetLabel } = parseArgs();

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in environment or .env.local");
  }

  const months = buildMonths(startYmd, endYmd);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });

  try {
    const regionsRes = await pool.query(
      `SELECT code, name_ko FROM region WHERE code LIKE $1 ORDER BY code`,
      [`${prefix}%`]
    );
    const regions = regionsRes.rows;

    const rawRes = await pool.query(
      `
      SELECT region_code, substr(deal_ymd, 1, 6) AS yyyymm, count(*)::int AS total_raw
      FROM deal_trade_raw
      WHERE region_code LIKE $1
        AND deal_ymd >= $2
        AND deal_ymd <= $3
      GROUP BY region_code, substr(deal_ymd, 1, 6)
      `,
      [`${prefix}%`, `${startYmd}01`, `${endYmd}31`]
    );

    const rawMap = new Map();
    for (const row of rawRes.rows) {
      if (!rawMap.has(row.region_code)) rawMap.set(row.region_code, new Map());
      rawMap.get(row.region_code).set(row.yyyymm, row.total_raw);
    }

    const stats = regions.map((region) => {
      const monthMap = rawMap.get(region.code) ?? new Map();
      const missing = [];
      let totalRaw = 0;
      let covered = 0;
      for (const m of months) {
        const count = monthMap.get(m) ?? 0;
        if (count > 0) {
          covered += 1;
          totalRaw += count;
        } else {
          missing.push(m);
        }
      }
      return {
        region_code: region.code,
        name_ko: REGION_NAME_OVERRIDES[region.code] || region.name_ko || `지역 ${region.code}`,
        missing_months: missing.length,
        covered_months: covered,
        total_raw: totalRaw,
        missing_list: missing.join(",")
      };
    });

    stats.sort((a, b) => {
      if (b.missing_months !== a.missing_months) return b.missing_months - a.missing_months;
      return b.total_raw - a.total_raw;
    });

    const groupsMap = new Map();
    for (const row of stats) {
      if (row.missing_months === 0) continue;
      if (!groupsMap.has(row.missing_months)) groupsMap.set(row.missing_months, []);
      groupsMap.get(row.missing_months).push(row);
    }

    const groups = [...groupsMap.entries()].sort((a, b) => b[0] - a[0]);
    const completed = stats.filter((row) => row.missing_months === 0);

    const reportDate = formatDateLocal(new Date());
    const md = buildMd({ title, startYmd, endYmd, targetLabel, groups, completed, reportDate });
    const outPath = out ?? path.join(process.cwd(), "docs", `${title}_COVERAGE_PRIORITY_${reportDate}.md`);
    fs.writeFileSync(outPath, md, "utf8");
    console.log(`[coverage] wrote ${outPath}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
