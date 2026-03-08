import type { MetadataRoute } from "next";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://saljip.kr";

async function getRecentComplexIds(limit = 500): Promise<number[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const pool = getDbPool();
    const result = await pool.query(
      `
      SELECT id
      FROM complex
      ORDER BY updated_at DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map((row) => Number(row.id)).filter((id) => Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const complexIds = await getRecentComplexIds(500);

  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1
    }
  ];

  const complexEntries: MetadataRoute.Sitemap = complexIds.map((id) => ({
    url: `${BASE_URL}/complexes/${id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7
  }));

  return [...baseEntries, ...complexEntries];
}
