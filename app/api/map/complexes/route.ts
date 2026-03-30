import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { MapComplex } from "@/lib/types";
import { DEFAULT_REGION_CODES } from "@/lib/regions";
import { getTopDeals } from "@/lib/api/molit";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";
import { buildSearchMatcher } from "@/lib/search/matcher";

const sortSchema = z.enum(["latest", "price_desc", "price_asc", "deal_count"]);
const MAX_DB_INT = 2_147_483_647;

const bboxSchema = z
  .object({
    sw_lat: z.coerce.number().min(-90).max(90),
    sw_lng: z.coerce.number().min(-180).max(180),
    ne_lat: z.coerce.number().min(-90).max(90),
    ne_lng: z.coerce.number().min(-180).max(180),
    q: z.string().trim().max(80).optional(),
    region: z.string().regex(/^\d{5}$/).optional(),
    min_price: z.coerce.number().int().min(0).max(MAX_DB_INT).optional(),
    max_price: z.coerce.number().int().min(0).max(MAX_DB_INT).optional(),
    max_age_years: z.coerce.number().int().min(0).max(100).optional(),
    min_total_units: z.coerce.number().int().min(0).max(MAX_DB_INT).optional(),
    max_total_units: z.coerce.number().int().min(0).max(MAX_DB_INT).optional(),
    sort: sortSchema.default("latest"),
    limit: z.coerce.number().int().min(1).max(500).default(300)
  })
  .refine((v) => v.sw_lat < v.ne_lat && v.sw_lng < v.ne_lng, {
    message: "Invalid bbox range"
  })
  .refine(
    (input) => {
      if (input.min_price === undefined || input.max_price === undefined) return true;
      return input.min_price <= input.max_price;
    },
    { message: "min_price must be less than or equal to max_price" }
  )
  .refine(
    (input) => {
      if (input.min_total_units === undefined || input.max_total_units === undefined) return true;
      return input.min_total_units <= input.max_total_units;
    },
    { message: "min_total_units must be less than or equal to max_total_units" }
  );

function parseExactOnly(params: URLSearchParams): boolean {
  const raw = params.get("exact_only");
  return raw === "true" || raw === "1";
}

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
  maxAgeYears: number | undefined,
  minTotalUnits: number | undefined,
  maxTotalUnits: number | undefined,
  exactOnly: boolean,
  sort: z.infer<typeof sortSchema>,
  limit: number
) {
  const pool = getDbPool();

  const orderBy =
    sort === "price_asc"
      ? "latest.deal_amount_manwon ASC NULLS LAST, scored.rank_score DESC, c.id DESC"
      : sort === "price_desc"
        ? "latest.deal_amount_manwon DESC NULLS LAST, scored.rank_score DESC, c.id DESC"
        : sort === "deal_count"
          ? "stats.deal_count_3m DESC, latest.deal_date DESC NULLS LAST, c.id DESC"
      : "latest.deal_date DESC NULLS LAST, scored.rank_score DESC, c.id DESC";
  const matcher = buildSearchMatcher(q ?? "");

  const result = await pool.query(
    `
    SELECT
      c.id,
      c.apt_name,
      c.legal_dong,
      c.location_source,
      c.build_year,
      c.total_units,
      r.code AS region_code,
      r.name_ko AS region_name,
      ST_Y(c.location::geometry) AS lat,
      ST_X(c.location::geometry) AS lng,
      latest.deal_amount_manwon,
      latest.deal_date,
      stats.deal_count_3m
    FROM complex c
    JOIN region r ON r.id = c.region_id
    LEFT JOIN LATERAL (
      SELECT d.deal_amount_manwon, d.deal_date
      FROM deal_trade_normalized d
      WHERE d.complex_id = c.id
      ORDER BY d.deal_date DESC
      LIMIT 1
    ) latest ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::INT AS deal_count_3m
      FROM deal_trade_normalized d
      WHERE d.complex_id = c.id
        AND d.deal_date >= (CURRENT_DATE - INTERVAL '3 months')
    ) stats ON true
    CROSS JOIN LATERAL (
      SELECT lower(regexp_replace(coalesce(c.apt_name, '') || coalesce(c.legal_dong, ''), '[^0-9a-zA-Z가-힣]', '', 'g')) AS text_norm
    ) norm
    CROSS JOIN LATERAL (
      SELECT
        CASE
          WHEN c.apt_name ILIKE $11 THEN 300
          WHEN c.legal_dong ILIKE $11 THEN 250
          WHEN c.apt_name ILIKE $6 THEN 180
          WHEN c.legal_dong ILIKE $6 THEN 140
          WHEN $15::TEXT IS NOT NULL AND norm.text_norm LIKE $15 THEN 200
          ELSE 0
        END
        + CASE
          WHEN $16::TEXT[] IS NOT NULL AND EXISTS (
            SELECT 1
            FROM unnest($16::TEXT[]) p
            WHERE p <> '' AND norm.text_norm LIKE ('%' || p || '%')
          ) THEN 60
          ELSE 0
        END
        + CASE
          WHEN $17::TEXT[] IS NOT NULL
           AND cardinality($17) > 0
           AND NOT EXISTS (
             SELECT 1
             FROM unnest($17::TEXT[]) t
             WHERE t <> '' AND norm.text_norm NOT LIKE ('%' || t || '%')
           ) THEN 80
          ELSE 0
        END
        + CASE
          WHEN latest.deal_date >= (CURRENT_DATE - INTERVAL '30 days') THEN 40
          WHEN latest.deal_date >= (CURRENT_DATE - INTERVAL '90 days') THEN 20
          ELSE 0
        END AS rank_score
    ) scored
    WHERE c.location IS NOT NULL
      AND (
        $6::TEXT IS NULL
        OR c.apt_name ILIKE $6
        OR c.legal_dong ILIKE $6
        OR ($15::TEXT IS NOT NULL AND norm.text_norm LIKE $15)
        OR (
          $16::TEXT[] IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM unnest($16::TEXT[]) p
            WHERE p <> '' AND norm.text_norm LIKE ('%' || p || '%')
          )
        )
        OR (
          $17::TEXT[] IS NOT NULL
          AND cardinality($17) > 0
          AND NOT EXISTS (
            SELECT 1
            FROM unnest($17::TEXT[]) t
            WHERE t <> '' AND norm.text_norm NOT LIKE ('%' || t || '%')
          )
        )
      )
      AND ($7::VARCHAR IS NULL OR r.code = $7)
      AND ($8::INT IS NULL OR latest.deal_amount_manwon >= $8)
      AND ($9::INT IS NULL OR latest.deal_amount_manwon <= $9)
      AND ($10::BOOLEAN = false OR c.location_source = 'exact')
      AND (
        $12::INT IS NULL
        OR (
          c.build_year IS NOT NULL
          AND (EXTRACT(YEAR FROM CURRENT_DATE)::INT - c.build_year) <= $12
        )
      )
      AND ($13::INT IS NULL OR c.total_units >= $13)
      AND ($14::INT IS NULL OR c.total_units <= $14)
      AND ST_Intersects(c.location, ST_MakeEnvelope($1, $2, $3, $4, 4326))
    ORDER BY ${orderBy}
    LIMIT $5
    `,
    [
      swLng,
      swLat,
      neLng,
      neLat,
      limit,
      q ? `%${q}%` : null,
      region ?? null,
      minPrice ?? null,
      maxPrice ?? null,
      exactOnly,
      matcher.qExact,
      maxAgeYears ?? null,
      minTotalUnits ?? null,
      maxTotalUnits ?? null,
      matcher.qNormLike,
      matcher.patternTerms,
      matcher.andTokens
    ]
  );

  return result.rows.map((r) => ({
      id: Number(r.id),
      aptId: `complex-${r.id}`,
      aptName: r.apt_name,
      legalDong: r.legal_dong ?? "",
      dealAmount: Number(r.deal_amount_manwon ?? 0),
      dealDate: r.deal_date ? new Date(r.deal_date).toISOString() : null,
      dealCount3m: Number(r.deal_count_3m ?? 0),
      regionCode: r.region_code ?? undefined,
      regionName: r.region_name ?? undefined,
      buildYear: r.build_year === null ? null : Number(r.build_year),
      totalUnits: r.total_units === null ? null : Number(r.total_units),
      lat: Number(r.lat),
      lng: Number(r.lng),
      locationQuality: r.location_source === "exact" ? "exact" : "approx",
      // Legacy field for backward compatibility.
      locationSource: r.location_source === "exact" ? "exact" : "approx"
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
          dealCount3m: 0,
          regionCode: code,
          regionName: undefined,
          buildYear: null,
          totalUnits: null,
          lat,
          lng,
          locationQuality: "approx",
          // Legacy field for backward compatibility.
          locationSource: "approx"
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
    const exactOnly = parseExactOnly(params);

    const parsed = bboxSchema.parse({
      sw_lat: params.get("sw_lat") ?? -90,
      sw_lng: params.get("sw_lng") ?? -180,
      ne_lat: params.get("ne_lat") ?? 90,
      ne_lng: params.get("ne_lng") ?? 180,
      q: params.get("q") ?? undefined,
      region: params.get("region") ?? undefined,
      min_price: params.get("min_price") ?? undefined,
      max_price: params.get("max_price") ?? undefined,
      max_age_years: params.get("max_age_years") ?? undefined,
      min_total_units: params.get("min_total_units") ?? undefined,
      max_total_units: params.get("max_total_units") ?? undefined,
      sort: params.get("sort") ?? "latest",
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
        parsed.max_age_years,
        parsed.min_total_units,
        parsed.max_total_units,
        exactOnly,
        parsed.sort,
        parsed.limit
      );
      return NextResponse.json({
        ok: true,
        source: "database",
        appliedSort: parsed.sort,
        exactOnly,
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
      appliedSort: parsed.sort,
      exactOnly,
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
