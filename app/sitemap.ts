import type { MetadataRoute } from "next";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://saljip.kr";

type ComplexSitemapRow = {
  id: number;
  updatedAt: string;
};

async function getRecentComplexRows(limit = 3000): Promise<ComplexSitemapRow[]> {
  if (!hasDatabaseUrl()) return [];

  try {
    const pool = getDbPool();
    const result = await pool.query(
      `
      SELECT id, updated_at
      FROM complex
      ORDER BY updated_at DESC
      LIMIT $1
      `,
      [limit]
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const complexRows = await getRecentComplexRows(3000);

  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9
    }
  ];

  const complexEntries: MetadataRoute.Sitemap = complexRows.map((row) => ({
    url: `${BASE_URL}/complexes/${row.id}`,
    lastModified: new Date(row.updatedAt),
    changeFrequency: "daily",
    priority: 0.7
  }));

  return [...baseEntries, ...complexEntries];
}
