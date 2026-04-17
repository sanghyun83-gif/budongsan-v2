import fs from "node:fs/promises";
import { chromium } from "playwright";

const rules = JSON.parse(await fs.readFile(new URL("../lib/legal/rules.production.json", import.meta.url), "utf8"));

const baseUrl = process.env.QA_BASE_URL || process.argv[2] || "http://localhost:3000";

const cases = [
  { name: "house_without_public", type: "house", amountManwon: 8000, includePublicCost: false, stampManwon: 0 },
  { name: "house_with_public", type: "house", amountManwon: 70000, includePublicCost: true, stampManwon: 70000 },
  { name: "building_with_public", type: "building", amountManwon: 150000, includePublicCost: true, stampManwon: 160000 },
  { name: "building_without_public", type: "building", amountManwon: 50000, includePublicCost: false, stampManwon: 0 },
];

function calcExpected(input) {
  const amountWon = input.amountManwon * 10000;
  const stampWon = input.stampManwon * 10000;
  const typeRule = rules.types[input.type];

  let remain = amountWon;
  let lower = 0;
  let bracketTotal = 0;
  for (const bracket of rules.brackets) {
    const taxable = Math.max(0, Math.min(remain, bracket.upToWon - lower));
    if (taxable > 0) {
      bracketTotal += taxable * bracket.rate;
      remain -= taxable;
    }
    lower = bracket.upToWon;
    if (remain <= 0) break;
  }

  const multiplied = Math.round(bracketTotal * typeRule.multiplier);
  const discount = Math.round(multiplied * typeRule.discountRate);
  const surcharge = Math.round(multiplied * typeRule.surchargeRate);
  const feeBeforeVat = multiplied + (surcharge - discount);

  const feeCap = Math.max(Math.round(amountWon * typeRule.maxFeeRate), rules.minimumFeeWon);
  const feeWon = Math.min(Math.max(feeBeforeVat, rules.minimumFeeWon), feeCap);
  const vatWon = Math.round(feeWon * rules.vatRate);

  let stampDuty = 0;
  if (input.includePublicCost) {
    for (const row of rules.publicCost.stampDuty) {
      if (stampWon <= row.upToWon) {
        stampDuty = row.dutyWon;
        break;
      }
    }
  }

  const publicCost = input.includePublicCost ? stampDuty + rules.publicCost.localStampWon + rules.publicCost.certificateWon : 0;
  return feeWon + vatWon + publicCost;
}

function parseWon(text) {
  const n = String(text).replace(/[^0-9-]/g, "");
  return Number(n || 0);
}

async function runCase(browser, scenario) {
  const page = await browser.newPage();
  try {
    await page.goto(`${baseUrl}/legal`, { waitUntil: "domcontentloaded" });

    if (scenario.type === "building") {
      await page.getByRole("button", { name: "그 외 건물" }).click();
    } else {
      await page.getByRole("button", { name: "주택" }).click();
    }

    await page.locator("#amount").fill(String(scenario.amountManwon));

    if (scenario.includePublicCost) {
      await page.locator("#publicCost").check();
      await page.locator("#stampAmount").fill(String(scenario.stampManwon));
    } else {
      await page.locator("#publicCost").uncheck().catch(() => {});
    }

    await page.locator("#submit").click();
    await page.locator("#resultSet table tbody tr").first().waitFor({ timeout: 10000 });

    const totalText = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("#resultSet table tbody tr"));
      const target = rows.find((row) => row.textContent?.includes("합계"));
      if (!target) return "";
      const cells = target.querySelectorAll("td");
      return cells.length ? (cells[cells.length - 1]?.textContent ?? "") : "";
    });
    const actual = parseWon(totalText);
    const expected = calcExpected(scenario);

    await page.close();
    return {
      ok: actual === expected,
      actual,
      expected,
      diff: actual - expected,
      error: null,
    };
  } catch (e) {
    await page.close();
    return {
      ok: false,
      actual: NaN,
      expected: calcExpected(scenario),
      diff: NaN,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

const browser = await chromium.launch({ headless: true });
const results = [];
for (const scenario of cases) {
  const result = await runCase(browser, scenario);
  results.push({ name: scenario.name, scenario, ...result });
  console.log(`${result.ok ? "PASS" : "FAIL"} ${scenario.name} expected=${result.expected} actual=${result.actual}`);
}
await browser.close();

const date = new Date().toISOString().slice(0, 10);
const mdPath = `docs/LEGAL_PARITY_REPORT_${date}.md`;
const jsonPath = `docs/LEGAL_PARITY_REPORT_${date}.json`;
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;

const lines = [];
lines.push(`# Legal Parity Report - ${date}`);
lines.push("");
lines.push(`- baseUrl: ${baseUrl}`);
lines.push(`- totalCases: ${results.length}`);
lines.push(`- pass: ${pass}`);
lines.push(`- fail: ${fail}`);
lines.push("");
lines.push("| status | case | expected(원) | actual(원) | diff | note |");
lines.push("|---|---|---:|---:|---:|---|");
for (const r of results) {
  lines.push(`| ${r.ok ? "PASS" : "FAIL"} | ${r.name} | ${Number.isFinite(r.expected) ? r.expected.toLocaleString("ko-KR") : "-"} | ${Number.isFinite(r.actual) ? r.actual.toLocaleString("ko-KR") : "-"} | ${Number.isFinite(r.diff) ? r.diff.toLocaleString("ko-KR") : "-"} | ${r.error ?? "-"} |`);
}

await fs.writeFile(mdPath, `${lines.join("\n")}\n`, "utf8");
await fs.writeFile(jsonPath, `${JSON.stringify({ baseUrl, pass, fail, results }, null, 2)}\n`, "utf8");

console.log(`Saved report: ${mdPath}`);
console.log(`Saved data: ${jsonPath}`);

if (fail > 0) process.exit(1);
