import fs from "node:fs";
import path from "node:path";
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
    exactMin: Number(argMap.get("exactMin") ?? "0.8"),
    failMax: Number(argMap.get("failMax") ?? "0.05")
  };
}

async function main() {
  loadEnvLocal();
  const { exactMin, failMax } = parseArgs();

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in environment or .env.local");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });

  try {
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
    const pass = exactRatio >= exactMin && failRatio <= failMax;

    const out = {
      ok: pass,
      checkedAt: new Date().toISOString(),
      target: { exactMin, failMax },
      metric: {
        total,
        exact,
        approx,
        pending,
        failed,
        success,
        permanentFailed,
        exactRatio: Number(exactRatio.toFixed(4)),
        failRatio: Number(failRatio.toFixed(4))
      }
    };

    console.log(JSON.stringify(out, null, 2));
    process.exit(pass ? 0 : 1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});