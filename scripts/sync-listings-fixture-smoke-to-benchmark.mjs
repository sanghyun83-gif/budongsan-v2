import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BENCHMARK_PATH = "docs/SALJIP_TOP_TIER1_FULL_BENCHMARK_REPORT_2026-03-30.md";
const NOTES_DIR = "notes";

function parseArgs(argv) {
  const out = {};
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const idx = raw.indexOf("=");
    if (idx === -1) {
      out[raw.slice(2)] = "true";
      continue;
    }
    out[raw.slice(2, idx)] = raw.slice(idx + 1);
  }
  return out;
}

function pickJsonReport(dateArg) {
  if (dateArg) {
    return join(NOTES_DIR, `listings-naver-fixture-smoke-${dateArg}.json`);
  }

  const files = readdirSync(NOTES_DIR)
    .filter((name) => /^listings-naver-fixture-smoke-\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .sort();

  if (files.length === 0) {
    throw new Error("fixture smoke report not found. Run `npm run qa:listings-naver-fixture` first.");
  }

  return join(NOTES_DIR, files[files.length - 1]);
}

function toPosix(path) {
  return path.replace(/\\/g, "/");
}

function buildFixtureBlock(reportPath, isPass, summary) {
  const mark = isPass ? "x" : " ";
  const status = isPass ? "PASS" : "FAIL";

  return [
    `- [${mark}] fixture 주입 검증 경로 추가`,
    "  - fixture: `lib/listings/providers/fixtures/naverLand.sample.json`",
    "  - smoke script: `npm run qa:listings-naver-fixture` (`scripts/listings-naver-fixture-smoke.mjs`)",
    `  - 최근 실행: ${status} (리포트: \`${toPosix(reportPath)}\`, 요약: ${summary})`
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const reportPath = pickJsonReport(args.date);
  const raw = readFileSync(reportPath, "utf8");
  const report = JSON.parse(raw);

  const isPass = Boolean(report?.checks?.ok);
  const dedupedCount = Number(report?.checks?.dedupedCount ?? 0);
  const uniqueIds = Boolean(report?.checks?.uniqueIds);
  const durationMs = Number(report?.durationMs ?? 0);
  const dealTypes = Array.isArray(report?.checks?.dealTypes) ? report.checks.dealTypes.join(",") : "-";
  const summary = `count=${dedupedCount}, uniqueIds=${uniqueIds ? "PASS" : "FAIL"}, dealTypes=${dealTypes}, ${durationMs}ms`;

  const benchmark = readFileSync(BENCHMARK_PATH, "utf8");
  const blockPattern = /- \[[ x]\] fixture 주입 검증 경로 추가\r?\n  - fixture: `lib\/listings\/providers\/fixtures\/naverLand\.sample\.json`\r?\n  - smoke script: `npm run qa:listings-naver-fixture` \(`scripts\/listings-naver-fixture-smoke\.mjs`\)(\r?\n  - 최근 실행: .*?)?/;

  if (!blockPattern.test(benchmark)) {
    throw new Error("fixture checklist block not found in benchmark report.");
  }

  const next = benchmark.replace(blockPattern, buildFixtureBlock(reportPath, isPass, summary));
  writeFileSync(BENCHMARK_PATH, next, "utf8");

  console.log(`Synced fixture smoke result: ${toPosix(reportPath)}`);
  console.log(`Status: ${isPass ? "PASS" : "FAIL"}`);
}

main();
