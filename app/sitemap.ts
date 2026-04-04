import type { MetadataRoute } from "next";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://saljip.kr";
const SITEMAP_CHUNK_SIZE = 1000;

type ComplexSitemapRow = {
  id: number;
  updatedAt: string;
};

async function getComplexCount(): Promise<number> {
  if (!hasDatabaseUrl()) return 0;

  try {
    const pool = getDbPool();
    const result = await pool.query(`SELECT COUNT(*)::INT AS total FROM complex`);
    const total = Number(result.rows[0]?.total ?? 0);
    return Number.isFinite(total) && total > 0 ? total : 0;
  } catch {
    return 0;
  }
}

async function getComplexChunk(chunkId: number, size = SITEMAP_CHUNK_SIZE): Promise<ComplexSitemapRow[]> {
  if (!hasDatabaseUrl()) return [];

  const offset = chunkId * size;

  try {
    const pool = getDbPool();
    const result = await pool.query(
      `
      SELECT id, updated_at
      FROM complex
      ORDER BY id ASC
      LIMIT $1 OFFSET $2
      `,
      [size, offset]
    );

    return result.rows
      .map((row) => ({
        id: Number(row.id),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString()
      }))
      .filter((row) => Number.isInteger(row.id) && row.id > 0);
  } catch {
    return [];
  }
}

export async function generateSitemaps() {
  const total = await getComplexCount();
  const chunks = Math.max(1, Math.ceil(total / SITEMAP_CHUNK_SIZE));
  return Array.from({ length: chunks }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const complexRows = await getComplexChunk(id, SITEMAP_CHUNK_SIZE);

  const baseEntries: MetadataRoute.Sitemap =
    id === 0
      ? [
          {
            url: `${BASE_URL}/`,
            lastModified: now,
            changeFrequency: "hourly",
            priority: 1
          }
        ]
      : [];

  const complexEntries: MetadataRoute.Sitemap = complexRows.map((row) => ({
    url: `${BASE_URL}/complexes/${row.id}`,
    lastModified: new Date(row.updatedAt),
    changeFrequency: "daily",
    priority: 0.7
  }));

  return [...baseEntries, ...complexEntries];
}
