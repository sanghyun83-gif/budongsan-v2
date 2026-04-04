import { spawnSync } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const forwardedArgs = process.argv.slice(2);

function run(commandArgs, label) {
  console.log(`\n[${label}] ${npmCmd} ${commandArgs.join(" ")}`);
  const result = spawnSync(npmCmd, commandArgs, {
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

// 1) fixture smoke 실행
run(["run", "qa:listings-naver-fixture"], "step-1");

// 2) 벤치마크 문서 동기화 (선택 인자 전달: -- --date=YYYY-MM-DD)
const syncArgs = ["run", "qa:sync-listings-fixture-benchmark"];
if (forwardedArgs.length > 0) {
  syncArgs.push("--", ...forwardedArgs);
}
run(syncArgs, "step-2");

console.log("\nDone: qa:listings-naver-fixture + qa:sync-listings-fixture-benchmark");
