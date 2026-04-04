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

function pickResultFile(dateArg) {
  if (dateArg) {
    const filename = `hub-manual-smoke-result-${dateArg}.md`;
    return join(NOTES_DIR, filename);
  }

  const files = readdirSync(NOTES_DIR)
    .filter((name) => /^hub-manual-smoke-result-\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .sort();

  if (files.length === 0) {
    throw new Error("manual smoke result file not found. Run qa:hub-manual-report first.");
  }

  return join(NOTES_DIR, files[files.length - 1]);
}

function parseResult(content) {
  const finalMatch = content.match(/^- final:\s*(.+)$/m);
  const summaryMatch = content.match(/^- summary:\s*(.+)$/m);
  const final = (finalMatch?.[1] || "미완료").trim();
  const summary = (summaryMatch?.[1] || "-").trim();
  return { final, summary };
}

function buildQaBlock({ checked, resultPath, final, summary }) {
  const mark = checked ? "x" : " ";
  const smokeLine = checked
    ? `  - 수동 스모크: PASS (리포트: \`${resultPath}\`)`
    : `  - 수동 스모크: ${final} (리포트: \`${resultPath}\`, 요약: ${summary})`;

  return [
    `- [${mark}] QA(\`lint/build/수동 스모크\`) 완료 후 체크 전환`,
    "  - `npm run lint`: PASS",
    "  - `npm run build`: PASS",
    smokeLine
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const resultPath = pickResultFile(args.date);
  const resultContent = readFileSync(resultPath, "utf8");
  const { final, summary } = parseResult(resultContent);
  const checked = final === "PASS";

  const benchmark = readFileSync(BENCHMARK_PATH, "utf8");
  const qaBlockPattern = /- \[[ x]\] QA\(`lint\/build\/수동 스모크`\) 완료 후 체크 전환\r?\n  - `npm run lint`: PASS\r?\n  - `npm run build`: PASS\r?\n  - .*?(?=\r?\n(?:-|$))/;

  if (!qaBlockPattern.test(benchmark)) {
    throw new Error("QA block not found in benchmark report.");
  }

  const next = benchmark.replace(
    qaBlockPattern,
    buildQaBlock({ checked, resultPath: resultPath.replace(/\\/g, "/"), final, summary })
  );

  writeFileSync(BENCHMARK_PATH, next, "utf8");

  console.log(`Synced benchmark QA block from: ${resultPath.replace(/\\/g, "/")}`);
  console.log(`Final result: ${final}`);
  console.log(`Checklist mark: [${checked ? "x" : " "}]`);
}

main();
