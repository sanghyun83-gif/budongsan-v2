import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const k = trimmed.slice(0, idx).trim();
    const v = trimmed.slice(idx + 1);
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
    limit: Number(argMap.get("limit") ?? "500"),
    onlyApprox: argMap.get("onlyApprox") !== "false"
  };
}

async function main() {
  loadEnvLocal();
  const { limit, onlyApprox } = parseArgs();

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in environment or .env.local");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query(
      `
      WITH picked AS (
        SELECT c.id AS complex_id
        FROM complex c
        WHERE ($1::BOOLEAN = false OR c.location_source = 'approx')
        ORDER BY c.updated_at DESC, c.id DESC
        LIMIT $2
      )
      INSERT INTO geocode_backfill_queue (complex_id, status, attempts, max_attempts, next_retry_at, updated_at)
      SELECT p.complex_id, 'pending', 0, 5, NOW(), NOW()
      FROM picked p
      ON CONFLICT (complex_id) DO UPDATE
      SET
        status = CASE
          WHEN geocode_backfill_queue.status = 'success' THEN geocode_backfill_queue.status
          ELSE 'pending'
        END,
        next_retry_at = NOW(),
        updated_at = NOW()
      RETURNING id
      `,
      [onlyApprox, limit]
    );

    console.log("[geocode:enqueue] done", {
      limit,
      onlyApprox,
      queuedOrUpdated: res.rowCount
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
