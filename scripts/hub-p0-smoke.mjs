import { writeFileSync } from "node:fs";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const runDate = new Date().toISOString();
const runDateShort = runDate.slice(0, 10);
const commonParams = new URLSearchParams({
  page: "1",
  size: "20",
  sw_lat: "37.0",
  sw_lng: "126.4",
  ne_lat: "37.8",
  ne_lng: "127.5"
});

const sortKeyword = "래미안";
const sortKeys = ["latest", "price_desc", "price_asc", "deal_count"];
const sampleKeywords = [
  "래미안",
  "자이",
  "힐스테이트",
  "더샵",
  "e편한세상",
  "아이파크",
  "푸르지오",
  "롯데캐슬",
  "센트럴",
  "센트럴뷰",
  "트리마제",
  "리버센트",
  "호반써밋",
  "위브",
  "예미지",
  "디에이치",
  "아크로",
  "브라이튼",
  "리첸시아",
  "센트레빌"
];

function isNonIncreasing(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  for (let i = 1; i < filtered.length; i += 1) {
    if (filtered[i] > filtered[i - 1]) return false;
  }
  return true;
}

function isNonDecreasing(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  for (let i = 1; i < filtered.length; i += 1) {
    if (filtered[i] < filtered[i - 1]) return false;
  }
  return true;
}

function parseDateMs(value) {
  if (!value) return Number.NaN;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

async function fetchSearch(q, sort) {
  const params = new URLSearchParams(commonParams);
  params.set("q", q);
  params.set("sort", sort);
  const res = await fetch(`${baseUrl}/api/search?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} while requesting /api/search (${q}, ${sort})`);
  }
  const json = await res.json();
  if (!json.ok) {
    throw new Error(`API error while requesting /api/search (${q}, ${sort}): ${json.error || "unknown"}`);
  }
  return json;
}

async function runSortSmoke() {
  const rows = [];

  for (const sort of sortKeys) {
    const json = await fetchSearch(sortKeyword, sort);
    const items = Array.isArray(json.items) ? json.items : [];
    const priceValues = items.map((item) => Number(item.deal_amount_manwon));
    const dealCountValues = items.map((item) => Number(item.deal_count_3m));
    const dateValues = items.map((item) => parseDateMs(item.deal_date));

    let orderPass = true;
    if (sort === "latest") orderPass = isNonIncreasing(dateValues);
    if (sort === "price_desc") orderPass = isNonIncreasing(priceValues);
    if (sort === "price_asc") orderPass = isNonDecreasing(priceValues);
    if (sort === "deal_count") orderPass = isNonIncreasing(dealCountValues);

    rows.push({
      sort,
      orderPass,
      count: Number(json.count ?? items.length),
      totalCount: Number(json.totalCount ?? items.length),
      first3: items.slice(0, 3).map((item) => ({
        aptName: item.apt_name ?? "",
        amount: item.deal_amount_manwon ?? null,
        dealDate: item.deal_date ?? null,
        dealCount3m: item.deal_count_3m ?? null
      }))
    });
  }

  return rows;
}

async function runKeywordSample() {
  const rows = [];
  for (const keyword of sampleKeywords) {
    const json = await fetchSearch(keyword, "latest");
    const totalCount = Number(json.totalCount ?? json.count ?? 0);
    rows.push({
      keyword,
      totalCount,
      zeroResult: totalCount <= 0
    });
  }

  const zeroCount = rows.filter((row) => row.zeroResult).length;
  const zeroRatio = rows.length === 0 ? 0 : zeroCount / rows.length;

  return {
    rows,
    zeroCount,
    sampleSize: rows.length,
    zeroRatio
  };
}

async function main() {
  const sortSmoke = await runSortSmoke();
  const keywordSample = await runKeywordSample();

  const report = {
    executedAt: runDate,
    baseUrl,
    sortKeyword,
    sortSmoke,
    keywordSample
  };

  const outputJsonPath = `notes/hub-p0-smoke-${runDateShort}.json`;
  writeFileSync(outputJsonPath, JSON.stringify(report, null, 2), "utf8");

  const outputMdPath = `notes/hub-p0-smoke-${runDateShort}.md`;
  const markdown = [
    `# Hub P0 Smoke (${runDateShort})`,
    "",
    `- Base URL: \`${baseUrl}\``,
    `- Sort keyword: \`${sortKeyword}\``,
    "",
    "## Sort Smoke",
    "| sort | orderPass | count | totalCount |",
    "| --- | --- | ---: | ---: |",
    ...sortSmoke.map((row) => `| ${row.sort} | ${row.orderPass ? "PASS" : "FAIL"} | ${row.count} | ${row.totalCount} |`),
    "",
    "## Keyword Sample (20)",
    `- sampleSize: ${keywordSample.sampleSize}`,
    `- zeroCount: ${keywordSample.zeroCount}`,
    `- zeroRatio: ${(keywordSample.zeroRatio * 100).toFixed(1)}%`,
    "",
    "| keyword | totalCount | zeroResult |",
    "| --- | ---: | --- |",
    ...keywordSample.rows.map((row) => `| ${row.keyword} | ${row.totalCount} | ${row.zeroResult ? "YES" : "NO"} |`)
  ].join("\n");
  writeFileSync(outputMdPath, `${markdown}\n`, "utf8");

  console.log(`Saved: ${outputJsonPath}`);
  console.log(`Saved: ${outputMdPath}`);
  console.log(`Sort summary: ${sortSmoke.map((r) => `${r.sort}=${r.orderPass ? "PASS" : "FAIL"}`).join(", ")}`);
  console.log(
    `Keyword summary: zero ${keywordSample.zeroCount}/${keywordSample.sampleSize} (${(keywordSample.zeroRatio * 100).toFixed(1)}%)`
  );
}

main().catch((error) => {
  console.error("[hub-p0-smoke] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
