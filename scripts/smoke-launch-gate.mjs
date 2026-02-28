const baseUrl = process.env.QA_BASE_URL || process.argv[2] || "http://localhost:3000";

const checks = [
  { name: "home", path: "/", expect: 200 },
  { name: "search", path: "/api/search?q=%EB%9E%98%EB%AF%B8%EC%95%88&page=1&size=5", expect: 200 },
  { name: "map", path: "/api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5&limit=5", expect: 200 },
  { name: "complex_valid", path: "/api/complexes/1", expect: 200 },
  { name: "complex_not_found", path: "/api/complexes/9999", expect: 404 },
  { name: "complex_bad_id", path: "/api/complexes/abc", expect: 400 },
  { name: "complex_deals", path: "/api/complexes/1/deals?page=1&size=20", expect: 200 },
  { name: "detail_page", path: "/complexes/1", expect: 200 }
];

const startedAt = new Date();
const results = [];

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  const t0 = Date.now();
  let status = -1;
  let ok = false;
  let error = null;

  try {
    const res = await fetch(url, { redirect: "follow" });
    status = res.status;
    ok = status === check.expect;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  results.push({
    name: check.name,
    path: check.path,
    expect: check.expect,
    status,
    ok,
    durationMs: Date.now() - t0,
    error
  });
}

const passCount = results.filter((r) => r.ok).length;
const success = passCount === results.length;

const reportDate = startedAt.toISOString().slice(0, 10);
const reportPath = `docs/LAUNCH_GATE_REPORT_${reportDate}.md`;

const lines = [];
lines.push(`# Launch Gate Report - ${reportDate}`);
lines.push("");
lines.push(`- baseUrl: ${baseUrl}`);
lines.push(`- startedAt: ${startedAt.toISOString()}`);
lines.push(`- total: ${results.length}`);
lines.push(`- passed: ${passCount}`);
lines.push(`- result: ${success ? "PASS" : "FAIL"}`);
lines.push("");
lines.push("## Regression Checks");
for (const r of results) {
  lines.push(`- ${r.ok ? "[PASS]" : "[FAIL]"} ${r.name} ${r.path} (expect ${r.expect}, got ${r.status}, ${r.durationMs}ms${r.error ? `, error=${r.error}` : ""})`);
}
lines.push("");
lines.push("## Lighthouse Mobile");
lines.push("- Run: `npm run qa:lighthouse:mobile`");
lines.push("- Output: `docs/lighthouse-mobile.html`");

await import("node:fs/promises").then(async (fs) => {
  await fs.writeFile(reportPath, `${lines.join("\n")}\n`, "utf8");
});

console.log(`Saved report: ${reportPath}`);
if (!success) process.exit(1);
