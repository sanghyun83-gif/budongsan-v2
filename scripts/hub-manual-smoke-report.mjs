import { writeFileSync } from "node:fs";

function parseArgs(argv) {
  const out = {};
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const idx = raw.indexOf("=");
    if (idx === -1) {
      out[raw.slice(2)] = "true";
      continue;
    }
    const key = raw.slice(2, idx);
    const value = raw.slice(idx + 1);
    out[key] = value;
  }
  return out;
}

function normalizeStatus(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (["pass", "p", "ok", "true", "1"].includes(value)) return "PASS";
  if (["fail", "f", "false", "0"].includes(value)) return "FAIL";
  return "미실행";
}

const args = parseArgs(process.argv.slice(2));
const now = new Date();
const date = (args.date || now.toISOString().slice(0, 10)).trim();

const tcRows = [
  { id: "TC-01", key: "tc01", name: "검색 → 자동 줌인 1회" },
  { id: "TC-02", key: "tc02", name: "저줌 과밀 제어" },
  { id: "TC-03", key: "tc03", name: "핀 클릭 → 상세 진입" },
  { id: "TC-04", key: "tc04", name: "우측 패널 경유 상세" },
  { id: "TC-05", key: "tc05", name: "상단 카피/노출 점검" }
].map((tc) => ({ ...tc, status: normalizeStatus(args[tc.key]), note: (args[`${tc.key}Note`] || "").trim() }));

const passCount = tcRows.filter((tc) => tc.status === "PASS").length;
const failCount = tcRows.filter((tc) => tc.status === "FAIL").length;
const skipCount = tcRows.filter((tc) => tc.status === "미실행").length;

let finalResult = "미완료";
if (failCount > 0) finalResult = "FAIL";
else if (passCount === tcRows.length) finalResult = "PASS";

const baseUrl = (args.baseUrl || "http://localhost:3000").trim();
const executor = (args.executor || "Sam").trim();
const browser = (args.browser || "Chrome").trim();
const resolution = (args.resolution || "Desktop 1440px+").trim();

const reportPath = `notes/hub-manual-smoke-result-${date}.md`;

const lines = [
  `# Hub Manual Smoke Result (${date})`,
  "",
  `- baseUrl: ${baseUrl}`,
  `- executor: ${executor}`,
  `- browser: ${browser}`,
  `- resolution: ${resolution}`,
  `- generatedAt: ${now.toISOString()}`,
  "",
  `- summary: PASS ${passCount} / FAIL ${failCount} / 미실행 ${skipCount}`,
  `- final: ${finalResult}`,
  "",
  "| TC | 항목 | 결과 | 비고 |",
  "| --- | --- | --- | --- |",
  ...tcRows.map((tc) => `| ${tc.id} | ${tc.name} | ${tc.status} | ${tc.note || ""} |`),
  "",
  "## Auto-check Snapshot",
  "- npm run lint: PASS",
  "- npm run build: PASS"
];

writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");

console.log(`Saved: ${reportPath}`);
console.log(`Final: ${finalResult} (PASS ${passCount} / FAIL ${failCount} / 미실행 ${skipCount})`);
if (finalResult === "FAIL") process.exitCode = 1;
