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

async function main() {
  loadEnvLocal();

  const sqlFile = process.argv[2] ?? "sql/002_seed.sql";
  const sqlPath = path.isAbsolute(sqlFile) ? sqlFile : path.join(process.cwd(), sqlFile);

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in environment or .env.local");
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });

  try {
    await pool.query(sql);
    console.log(`Applied SQL: ${sqlFile}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
