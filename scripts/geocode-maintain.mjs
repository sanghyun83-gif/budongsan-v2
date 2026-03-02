import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Pool } from "pg";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

function parseArgs() {
  const argMap = new Map();
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.split("=");
    argMap.set(k.replace(/^--/, ""), v ?? "true");
  }

  return {
    rounds: Number(argMap.get("rounds") ?? "6"),
    batch: Number(argMap.get("batch") ?? "50"),
    exactMin: Number(argMap.get("exactMin") ?? "0.8"),
    failMax: Number(argMap.get("failMax") ?? "0.05"),
    strict: argMap.get("strict") !== "false"
  };
}

function runOrThrow(cmd, args) {
  const out = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (out.status !== 0) {
    throw new Error(`command failed: ${cmd} ${args.join(" ")}`);
  }
}

async function getStats(pool) {
  const [summaryRes, queueRes] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE location_source='exact')::INT AS exact,
        COUNT(*) FILTER (WHERE location_source='approx')::INT AS approx
      FROM complex
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='pending')::INT AS pending,
        COUNT(*) FILTER (WHERE status='failed')::INT AS failed,
        COUNT(*) FILTER (WHERE status='success')::INT AS success,
        COUNT(*) FILTER (WHERE status='permanent_failed')::INT AS permanent_failed
      FROM geocode_backfill_queue
    `)
  ]);

  const total = Number(summaryRes.rows[0]?.total ?? 0);
  const exact = Number(summaryRes.rows[0]?.exact ?? 0);
  const approx = Number(summaryRes.rows[0]?.approx ?? 0);
  const pending = Number(queueRes.rows[0]?.pending ?? 0);
  const failed = Number(queueRes.rows[0]?.failed ?? 0);
  const success = Number(queueRes.rows[0]?.success ?? 0);
  const permanentFailed = Number(queueRes.rows[0]?.permanent_failed ?? 0);
  const exactRatio = total > 0 ? exact / total : 0;
  const failRatio = total > 0 ? failed / total : 0;

  return {
    total,
    exact,
    approx,
    pending,
    failed,
    success,
    permanentFailed,
    exactRatio: Number(exactRatio.toFixed(4)),
    failRatio: Number(failRatio.toFixed(4))
  };
}

async function main() {
  loadEnvLocal();
  const { rounds, batch, exactMin, failMax, strict } = parseArgs();

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in environment or .env.local");
  }
  if (!process.env.KAKAO_REST_API_KEY) {
    throw new Error("Missing KAKAO_REST_API_KEY in environment or .env.local");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });

  try {
    const initial = await getStats(pool);
    console.log("[geocode:maintain] initial", initial);

    runOrThrow("npm", ["run", "geocode:enqueue"]);

    let latest = initial;
    for (let i = 1; i <= rounds; i += 1) {
      const pass = latest.exactRatio >= exactMin && latest.failRatio <= failMax;
      if (pass) break;

      console.log(`[geocode:maintain] round=${i} batch=${batch}`);
      runOrThrow("node", ["scripts/backfill-geocode-kakao.mjs", `--batch=${batch}`]);
      latest = await getStats(pool);
      console.log("[geocode:maintain] stats", latest);
    }

    const finalPass = latest.exactRatio >= exactMin && latest.failRatio <= failMax;
    const result = {
      ok: finalPass,
      strict,
      target: { exactMin, failMax },
      metric: latest,
      finishedAt: new Date().toISOString()
    };

    console.log(JSON.stringify(result, null, 2));

    if (!finalPass && strict) {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});