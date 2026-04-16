import fs from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL || process.argv[2] || "http://localhost:3000";

const cases = [
  { name: "sale_house_default", dealType: "sale", estateType: "house", amount: 95000 },
  { name: "lease_house_default", dealType: "lease", estateType: "house", amount: 45000 },
  { name: "rent_house_with_monthly", dealType: "rent", estateType: "house", amount: 5000, rent: 120 },
  { name: "sale_distribution", dealType: "sale", estateType: "distribution", amount: 70000, premium: 8000 },
  { name: "sale_officetel_custom_vat", dealType: "sale", estateType: "officetel", amount: 120000, customVatRate: 12 },
  { name: "sale_etc_custom_rate", dealType: "sale", estateType: "etc", amount: 30000, customRate: 0.7 }
];

function parseManwon(text) {
  const cleaned = String(text ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/g);
  if (!cleaned || cleaned.length === 0) return NaN;
  return Number(cleaned[0]);
}

async function setDealType(page, type) {
  const labels =
    type === "sale"
      ? ["매매계약", "매매"]
      : type === "lease"
        ? ["전세계약", "전세"]
        : ["월세계약", "월세"];

  for (const label of labels) {
    const locator = page.getByRole("button", { name: label }).first();
    if (await locator.count()) {
      await locator.click();
      return;
    }
  }

  throw new Error(`dealType button not found: ${type}`);
}

async function setEstateType(page, type) {
  const label = type === "house" ? "주택" : type === "officetel" ? "오피스텔" : type === "distribution" ? "분양권" : "그 외";
  await page.getByRole("button", { name: label }).first().click();
}

async function runReactCase(browser, scenario) {
  const page = await browser.newPage();
  const started = Date.now();
  try {
    await page.goto(`${baseUrl}/commission`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);

    await setDealType(page, scenario.dealType);
    await setEstateType(page, scenario.estateType);

    await page.locator("#commission-react-amount").fill(String(scenario.amount));

    if (scenario.dealType === "rent") {
      await page.locator("#commission-react-rent").fill(String(scenario.rent ?? 0));
    }

    if (scenario.estateType === "distribution") {
      await page.locator("#commission-react-premium").fill(String(scenario.premium ?? 0));
    }

    if (typeof scenario.customRate === "number") {
      await page.locator("#commission-react-custom-rate-enabled").check();
      await page.locator("#commission-react-custom-rate").fill(String(scenario.customRate));
    }

    if (typeof scenario.customVatRate === "number") {
      await page.locator("#commission-react-custom-vat-enabled").check();
      await page.locator("#commission-react-custom-vat").fill(String(scenario.customVatRate));
    }

    await page.locator("#commission-react-submit").click();
    await page.locator("#commission-react-total").waitFor({ timeout: 8000 });

    const totalText = await page.locator("#commission-react-total").innerText();
    const totalManwon = parseManwon(totalText);

    await page.close();
    return {
      ok: Number.isFinite(totalManwon),
      totalManwon,
      totalText,
      durationMs: Date.now() - started,
      error: null
    };
  } catch (e) {
    await page.close();
    return {
      ok: false,
      totalManwon: NaN,
      totalText: "",
      durationMs: Date.now() - started,
      error: e instanceof Error ? e.message : String(e)
    };
  }
}

async function runMockCase(browser, scenario) {
  const page = await browser.newPage();
  const started = Date.now();
  try {
    await page.goto(`${baseUrl}/mock/commission`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    await setDealType(page, scenario.dealType);
    await setEstateType(page, scenario.estateType);

    await page.locator("#amount").fill(String(scenario.amount));

    if (scenario.dealType === "rent") {
      await page.locator("#rent").fill(String(scenario.rent ?? 0));
    }

    if (scenario.estateType === "distribution") {
      await page.locator("#premium").fill(String(scenario.premium ?? 0));
    }

    if (typeof scenario.customRate === "number") {
      await page.locator("#customRateCheck").check();
      await page.locator("#customRate").fill(String(scenario.customRate));
    }

    if (typeof scenario.customVatRate === "number") {
      await page.locator("#customVatRateYn").check();
      await page.locator("#customVatRate").fill(String(scenario.customVatRate));
    }

    await page.locator("#submit").click();
    await page.locator("#resultSet table").waitFor({ timeout: 8000 });

    const totalText = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("#resultSet table tbody tr"));
      const target = rows.find((row) => row.textContent?.includes("합계")) || rows.find((row) => row.textContent?.includes("부가세 포함"));
      if (!target) return "";
      const tds = target.querySelectorAll("td");
      return tds.length > 2 ? (tds[2]?.textContent ?? "") : tds.length > 1 ? (tds[1]?.textContent ?? "") : "";
    });

    const parsed = parseManwon(totalText);
    const totalManwon = Number.isFinite(parsed) ? parsed / 10000 : NaN;

    await page.close();
    return {
      ok: Number.isFinite(totalManwon),
      totalManwon,
      totalText,
      durationMs: Date.now() - started,
      error: null
    };
  } catch (e) {
    await page.close();
    return {
      ok: false,
      totalManwon: NaN,
      totalText: "",
      durationMs: Date.now() - started,
      error: e instanceof Error ? e.message : String(e)
    };
  }
}

const browser = await chromium.launch({ headless: true });
const results = [];

for (const scenario of cases) {
  const react = await runReactCase(browser, scenario);
  const mock = await runMockCase(browser, scenario);

  const same = react.ok && mock.ok && Math.abs(react.totalManwon - mock.totalManwon) < 0.01;
  results.push({
    name: scenario.name,
    scenario,
    react,
    mock,
    same
  });

  console.log(`${same ? "PASS" : "FAIL"} ${scenario.name} | react=${react.totalText} mock=${mock.totalText}`);
}

await browser.close();

const startedAt = new Date();
const reportDate = startedAt.toISOString().slice(0, 10);
const mdPath = `docs/COMMISSION_PARITY_REPORT_${reportDate}.md`;
const jsonPath = `docs/COMMISSION_PARITY_REPORT_${reportDate}.json`;

const pass = results.filter((r) => r.same).length;
const fail = results.length - pass;

const lines = [];
lines.push(`# Commission Mock-React Parity Report - ${reportDate}`);
lines.push("");
lines.push(`- baseUrl: ${baseUrl}`);
lines.push(`- totalCases: ${results.length}`);
lines.push(`- pass: ${pass}`);
lines.push(`- fail: ${fail}`);
lines.push("");
lines.push("| status | case | react total | mock total | note |");
lines.push("|---|---|---:|---:|---|");
for (const r of results) {
  const note = r.same
    ? "-"
    : `${r.react.error ? `react=${r.react.error}` : ""}${r.mock.error ? ` mock=${r.mock.error}` : ""}`.trim() || "값 불일치";
  lines.push(`| ${r.same ? "PASS" : "FAIL"} | ${r.name} | ${r.react.totalText || "-"} | ${r.mock.totalText || "-"} | ${note} |`);
}

await fs.writeFile(mdPath, `${lines.join("\n")}\n`, "utf8");
await fs.writeFile(
  jsonPath,
  `${JSON.stringify({ baseUrl, totalCases: results.length, pass, fail, results }, null, 2)}\n`,
  "utf8"
);

console.log(`Saved report: ${mdPath}`);
console.log(`Saved data: ${jsonPath}`);

if (fail > 0) process.exit(1);
