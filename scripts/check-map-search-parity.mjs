import fs from "node:fs/promises";

const baseUrl = process.env.QA_BASE_URL || process.argv[2] || "https://budongsan-v2.vercel.app";

const sorts = ["latest", "price_desc", "price_asc", "deal_count"];

const queryCases = [
  { name: "brand_raemian", q: "\uB798\uBBF8\uC548" },
  { name: "brand_xi", q: "\uC790\uC774" },
  { name: "brand_hillstate", q: "\uD790\uC2A4\uD14C\uC774\uD2B8" },
  { name: "brand_prugio", q: "\uD478\uB974\uC9C0\uC624" },
  { name: "dong_daechi", q: "\uB300\uCE58" },
  { name: "dong_jamsil", q: "\uC7A0\uC2E4" }
];

const bboxCases = [
  {
    name: "seoul_wide",
    sw_lat: "37.40",
    sw_lng: "126.75",
    ne_lat: "37.70",
    ne_lng: "127.20"
  },
  {
    name: "gangnam_core",
    sw_lat: "37.47",
    sw_lng: "126.98",
    ne_lat: "37.55",
    ne_lng: "127.08"
  },
  {
    name: "jamsil_core",
    sw_lat: "37.49",
    sw_lng: "127.04",
    ne_lat: "37.55",
    ne_lng: "127.14"
  }
];

const LIMIT = "50";

function toIdSet(arr, key) {
  return new Set((arr || []).map((x) => String(x?.[key])).filter(Boolean));
}

function setDiff(a, b) {
  const out = [];
  for (const v of a) {
    if (!b.has(v)) out.push(v);
  }
  return out;
}

async function runOne({ qCase, bboxCase, sort }) {
  const params = new URLSearchParams({
    q: qCase.q,
    sort,
    sw_lat: bboxCase.sw_lat,
    sw_lng: bboxCase.sw_lng,
    ne_lat: bboxCase.ne_lat,
    ne_lng: bboxCase.ne_lng
  });

  const searchParams = new URLSearchParams(params);
  searchParams.set("page", "1");
  searchParams.set("size", LIMIT);

  const mapParams = new URLSearchParams(params);
  mapParams.set("limit", LIMIT);

  const searchUrl = `${baseUrl}/api/search?${searchParams.toString()}`;
  const mapUrl = `${baseUrl}/api/map/complexes?${mapParams.toString()}`;

  const t0 = Date.now();
  let searchStatus = -1;
  let mapStatus = -1;
  let error = null;

  try {
    const [searchRes, mapRes] = await Promise.all([fetch(searchUrl), fetch(mapUrl)]);
    searchStatus = searchRes.status;
    mapStatus = mapRes.status;

    const [searchJson, mapJson] = await Promise.all([searchRes.json(), mapRes.json()]);

    if (!searchRes.ok || !searchJson.ok) throw new Error(`search failed: ${searchStatus}`);
    if (!mapRes.ok || !mapJson.ok) throw new Error(`map failed: ${mapStatus}`);

    const searchIds = toIdSet(searchJson.items, "id");
    const mapIds = toIdSet(mapJson.complexes, "id");

    const onlySearch = setDiff(searchIds, mapIds);
    const onlyMap = setDiff(mapIds, searchIds);

    const pass = onlySearch.length === 0 && onlyMap.length === 0;

    return {
      name: `${qCase.name}__${bboxCase.name}__${sort}`,
      q: qCase.q,
      bbox: bboxCase.name,
      sort,
      searchStatus,
      mapStatus,
      searchCount: searchIds.size,
      mapCount: mapIds.size,
      pass,
      onlySearch: onlySearch.slice(0, 10),
      onlyMap: onlyMap.slice(0, 10),
      durationMs: Date.now() - t0,
      error
    };
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    return {
      name: `${qCase.name}__${bboxCase.name}__${sort}`,
      q: qCase.q,
      bbox: bboxCase.name,
      sort,
      searchStatus,
      mapStatus,
      searchCount: 0,
      mapCount: 0,
      pass: false,
      onlySearch: [],
      onlyMap: [],
      durationMs: Date.now() - t0,
      error
    };
  }
}

const startedAt = new Date();
const cases = [];
for (const qCase of queryCases) {
  for (const bboxCase of bboxCases) {
    for (const sort of sorts) {
      cases.push({ qCase, bboxCase, sort });
    }
  }
}

const results = [];
for (const c of cases) {
  // Keep sequential for stable API pressure on hobby plan.
  const r = await runOne(c);
  results.push(r);
  process.stdout.write(`${r.pass ? "PASS" : "FAIL"} ${r.name} (${r.durationMs}ms)\n`);
}

const passed = results.filter((r) => r.pass).length;
const failed = results.length - passed;
const reportDate = startedAt.toISOString().slice(0, 10);
const reportPath = `docs/MAP_SEARCH_PARITY_REPORT_${reportDate}.md`;
const jsonPath = `docs/MAP_SEARCH_PARITY_REPORT_${reportDate}.json`;

const lines = [];
lines.push(`# Map-Search Parity Report - ${reportDate}`);
lines.push("");
lines.push(`- baseUrl: ${baseUrl}`);
lines.push(`- startedAt: ${startedAt.toISOString()}`);
lines.push(`- totalCases: ${results.length}`);
lines.push(`- pass: ${passed}`);
lines.push(`- fail: ${failed}`);
lines.push(`- limitPolicy: search size=${LIMIT}, map limit=${LIMIT} (same-set expected)`);
lines.push("");
lines.push("## Result Table");
lines.push("");
lines.push("| status | case | q | bbox | sort | searchCount | mapCount | durationMs | note |");
lines.push("|---|---|---|---|---|---:|---:|---:|---|");

for (const r of results) {
  const note = r.pass
    ? "-"
    : `${r.error ? `error=${r.error}` : ""}${r.onlySearch.length ? ` onlySearch=${r.onlySearch.join(",")}` : ""}${r.onlyMap.length ? ` onlyMap=${r.onlyMap.join(",")}` : ""}`.trim();
  lines.push(`| ${r.pass ? "PASS" : "FAIL"} | ${r.name} | ${r.q} | ${r.bbox} | ${r.sort} | ${r.searchCount} | ${r.mapCount} | ${r.durationMs} | ${note || "-"} |`);
}

lines.push("");
lines.push("## Conclusion");
lines.push(failed === 0 ? "- PASS: tested cases are map-search consistent." : "- FAIL: mismatch exists. inspect failed rows and align map/search query rules.");

await fs.writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
await fs.writeFile(
  jsonPath,
  `${JSON.stringify(
    {
      baseUrl,
      startedAt: startedAt.toISOString(),
      totalCases: results.length,
      pass: passed,
      fail: failed,
      results
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`Saved report: ${reportPath}`);
console.log(`Saved data: ${jsonPath}`);

if (failed > 0) process.exit(1);