import { writeFileSync } from "node:fs";

const baseUrl = (process.env.BASE_URL || "http://localhost:3000").trim().replace(/\/+$/, "");
const complexId = Number(process.env.COMPLEX_ID || 1);
const now = new Date();
const date = now.toISOString().slice(0, 10);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasUniqueIds(items) {
  const ids = items.map((item) => item.id);
  return new Set(ids).size === ids.length;
}

async function main() {
  const sp = new URLSearchParams({
    page: "1",
    size: "20",
    dealType: "all",
    propertyType: "apartment",
    provider: "naver_land",
    fixture: "sample"
  });

  const url = `${baseUrl}/api/complexes/${complexId}/listings?${sp.toString()}`;
  const t0 = Date.now();
  const res = await fetch(url, { cache: "no-store" });
  const durationMs = Date.now() - t0;

  const contentType = res.headers.get("content-type") ?? "";
  const bodyText = await res.text();
  let json;

  try {
    json = JSON.parse(bodyText);
  } catch {
    const preview = bodyText.slice(0, 400).replace(/\s+/g, " ").trim();
    throw new Error(
      [
        `Invalid JSON response`,
        `status=${res.status}`,
        `contentType=${contentType || "-"}`,
        `url=${url}`,
        `bodyPreview=${preview || "(empty)"}`
      ].join(" | ")
    );
  }

  if (!res.ok) {
    const preview = bodyText.slice(0, 400).replace(/\s+/g, " ").trim();
    throw new Error(
      [
        `HTTP ${res.status}`,
        `contentType=${contentType || "-"}`,
        `url=${url}`,
        `bodyPreview=${preview || "(empty)"}`
      ].join(" | ")
    );
  }

  assert(json.ok === true, "json.ok must be true");
  assert(json.adapterKey === "naver_land", "adapterKey must be naver_land");
  assert(json.adapterContractVersion === "v1", "adapterContractVersion must be v1");
  assert(Array.isArray(json.listings), "listings must be array");

  const listings = json.listings;
  assert(listings.length === 3, `fixture dedupe result count must be 3, got ${listings.length}`);
  assert(hasUniqueIds(listings), "listing ids must be unique after dedupe");
  assert(listings.some((item) => item.dealType === "sale"), "must include sale listing");
  assert(listings.some((item) => item.dealType === "jeonse"), "must include jeonse listing");
  assert(listings.some((item) => item.dealType === "wolse"), "must include wolse listing");

  const report = {
    executedAt: now.toISOString(),
    baseUrl,
    complexId,
    url,
    durationMs,
    status: res.status,
    checks: {
      ok: true,
      adapterKey: json.adapterKey,
      adapterContractVersion: json.adapterContractVersion,
      dedupedCount: listings.length,
      uniqueIds: hasUniqueIds(listings),
      dealTypes: Array.from(new Set(listings.map((item) => item.dealType))).sort()
    },
    sampleListings: listings
  };

  const jsonPath = `notes/listings-naver-fixture-smoke-${date}.json`;
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const mdLines = [
    `# Listings Naver Fixture Smoke (${date})`,
    "",
    `- baseUrl: ${baseUrl}`,
    `- complexId: ${complexId}`,
    `- status: ${res.status}`,
    `- durationMs: ${durationMs}`,
    "",
    "## Checks",
    `- adapterKey: ${json.adapterKey}`,
    `- adapterContractVersion: ${json.adapterContractVersion}`,
    `- dedupedCount: ${listings.length}`,
    `- uniqueIds: ${hasUniqueIds(listings) ? "PASS" : "FAIL"}`,
    `- dealTypes: ${Array.from(new Set(listings.map((item) => item.dealType))).sort().join(", ")}`,
    "",
    "## Sample Listings",
    "| id | dealType | priceManwon | depositManwon | monthlyRentManwon | areaM2 | floor |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ...listings.map(
      (item) =>
        `| ${item.id} | ${item.dealType} | ${item.priceManwon ?? "-"} | ${item.depositManwon ?? "-"} | ${item.monthlyRentManwon ?? "-"} | ${item.areaM2 ?? "-"} | ${item.floor ?? "-"} |`
    )
  ];

  const mdPath = `notes/listings-naver-fixture-smoke-${date}.md`;
  writeFileSync(mdPath, `${mdLines.join("\n")}\n`, "utf8");

  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${mdPath}`);
  console.log(`PASS: adapter=${json.adapterKey}, count=${listings.length}, duration=${durationMs}ms`);
}

main().catch((error) => {
  console.error("[listings-naver-fixture-smoke] failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
