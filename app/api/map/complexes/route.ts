import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { MapComplex } from "@/lib/types";
import { DEFAULT_REGION_CODES } from "@/lib/regions";
import { getTopDeals } from "@/lib/api/molit";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const bboxSchema = z
  .object({
    sw_lat: z.coerce.number().min(-90).max(90),
    sw_lng: z.coerce.number().min(-180).max(180),
    ne_lat: z.coerce.number().min(-90).max(90),
    ne_lng: z.coerce.number().min(-180).max(180),
    q: z.string().trim().max(80).optional(),
    region: z.string().regex(/^\d{5}$/).optional(),
    min_price: z.coerce.number().int().min(0).optional(),
    max_price: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(300)
  })
  .refine((v) => v.sw_lat < v.ne_lat && v.sw_lng < v.ne_lng, {
    message: "Invalid bbox range"
  });

function hashToOffset(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) % 10000;
  }
  return (h / 10000 - 0.5) * 0.08;
}

function regionCenter(code: string): { lat: number; lng: number } {
  if (code === "11680") return { lat: 37.5172, lng: 127.0473 };
  if (code === "11650") return { lat: 37.4837, lng: 127.0324 };
  if (code === "11710") return { lat: 37.5145, lng: 127.1066 };
  if (code === "41135") return { lat: 37.3826, lng: 127.1187 };
  if (code === "41465") return { lat: 37.3222, lng: 127.0977 };
  return { lat: 37.5665, lng: 126.978 };
}

async function fetchFromDatabase(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  q: string | undefined,
  region: string | undefined,
  minPrice: number | undefined,
  maxPrice: number | undefined,
  limit: number
) {
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      c.id,
      c.apt_name,
      c.legal_dong,
      r.code AS region_code,
      ST_Y(c.location::geometry) AS lat,
      ST_X(c.location::geometry) AS lng,
      latest.deal_amount_manwon
    FROM complex c
    JOIN region r ON r.id = c.region_id
    LEFT JOIN LATERAL (
      SELECT d.deal_amount_manwon
      FROM deal_trade_normalized d
      WHERE d.complex_id = c.id
      ORDER BY d.deal_date DESC
      LIMIT 1
    ) latest ON true
    WHERE c.location IS NOT NULL
      AND ($6::TEXT IS NULL OR c.apt_name ILIKE $6 OR c.legal_dong ILIKE $6)
      AND ($7::VARCHAR IS NULL OR r.code = $7)
      AND ($8::INT IS NULL OR latest.deal_amount_manwon >= $8)
      AND ($9::INT IS NULL OR latest.deal_amount_manwon <= $9)
      AND ST_Intersects(
        c.location,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
    ORDER BY latest.deal_amount_manwon DESC NULLS LAST, c.id DESC
    LIMIT $5
    `,
    [swLng, swLat, neLng, neLat, limit, q ? `%${q}%` : null, region ?? null, minPrice ?? null, maxPrice ?? null]
  );

  return result.rows.map((r) => ({
    id: Number(r.id),
    aptId: `complex-${r.id}`,
    aptName: r.apt_name,
    legalDong: r.legal_dong ?? "",
    dealAmount: Number(r.deal_amount_manwon ?? 0),
    lat: Number(r.lat),
    lng: Number(r.lng)
  })) as MapComplex[];
}

async function fetchFallback(swLat: number, swLng: number, neLat: number, neLng: number, limit: number) {
  const regionDeals = await Promise.all(
    DEFAULT_REGION_CODES.map(async (code) => {
      const deals = await getTopDeals(code, 2, 50);
      const center = regionCenter(code);
      return deals.map((d, idx) => {
        const lat = center.lat + hashToOffset(d.aptId + "lat");
        const lng = center.lng + hashToOffset(d.aptId + "lng");
        const out: MapComplex = {
          id: idx + 1,
          aptId: d.aptId,
          aptName: d.aptName,
          legalDong: d.legalDong,
          dealAmount: d.dealAmount,
          lat,
          lng
        };
        return out;
      });
    })
  );

  const all = regionDeals.flat();
  const dedup = new Map<string, MapComplex>();
  for (const item of all) {
    if (!dedup.has(item.aptId)) dedup.set(item.aptId, item);
  }

  return Array.from(dedup.values())
    .filter((c) => c.lat >= swLat && c.lat <= neLat && c.lng >= swLng && c.lng <= neLng)
    .slice(0, limit);
}

export async function GET(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    const params = req.nextUrl.searchParams;
    const parsed = bboxSchema.parse({
      sw_lat: params.get("sw_lat") ?? -90,
      sw_lng: params.get("sw_lng") ?? -180,
      ne_lat: params.get("ne_lat") ?? 90,
      ne_lng: params.get("ne_lng") ?? 180,
      q: params.get("q") ?? undefined,
      region: params.get("region") ?? undefined,
      min_price: params.get("min_price") ?? undefined,
      max_price: params.get("max_price") ?? undefined,
      limit: params.get("limit") ?? 300
    });

    if (hasDatabaseUrl()) {
      const complexes = await fetchFromDatabase(
        parsed.sw_lat,
        parsed.sw_lng,
        parsed.ne_lat,
        parsed.ne_lng,
        parsed.q,
        parsed.region,
        parsed.min_price,
        parsed.max_price,
        parsed.limit
      );
      return NextResponse.json({
        ok: true,
        source: "database",
        count: complexes.length,
        complexes,
        updatedAt: new Date().toISOString()
      });
    }

    const fallback = await fetchFallback(parsed.sw_lat, parsed.sw_lng, parsed.ne_lat, parsed.ne_lng, parsed.limit);
    return NextResponse.json({
      ok: true,
      source: "fallback",
      warning: "DATABASE_URL is not configured. Returning fallback map data.",
      count: fallback.length,
      complexes: fallback,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    logApiError("GET /api/map/complexes", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = 400;
    return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/map/complexes", performance.now() - started, status);
  }
}

