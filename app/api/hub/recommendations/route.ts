import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const SOURCE_LABEL = "국토교통부 실거래가 공개데이터";
const MAX_DB_INT = 2_147_483_647;

const querySchema = z
  .object({
    q: z.string().trim().min(1).max(80).optional(),
    region: z.string().regex(/^\d{5}$/).optional(),
    min_price: z.coerce.number().int().min(0).max(MAX_DB_INT).optional(),
    max_price: z.coerce.number().int().min(0).max(MAX_DB_INT).optional(),
    sw_lat: z.coerce.number().min(-90).max(90).optional(),
    sw_lng: z.coerce.number().min(-180).max(180).optional(),
    ne_lat: z.coerce.number().min(-90).max(90).optional(),
    ne_lng: z.coerce.number().min(-180).max(180).optional(),
    limit: z.coerce.number().int().min(1).max(20).default(8)
  })
  .refine(
    (input) => {
      if (input.min_price === undefined || input.max_price === undefined) return true;
      return input.min_price <= input.max_price;
    },
    { message: "min_price must be less than or equal to max_price" }
  );

function parseExactOnly(params: URLSearchParams): boolean {
  const raw = params.get("exact_only");
  return raw === "true" || raw === "1";
}

function toTimestamp(value: unknown): number {
  if (!value) return 0;
  const ts = new Date(String(value)).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function toReasonLabels(row: Record<string, unknown>): string[] {
  const labels: string[] = [];
  const sameRegion = row.same_region_score === true;
  const similarPrice = row.similar_price_score === true;
  const activeDeals = row.active_deals_score === true;

  if (sameRegion) labels.push("동일 지역");
  if (similarPrice) labels.push("가격대 유사");
  if (activeDeals) labels.push("최근 거래 활발");

  if (labels.length === 0 && Number(row.deal_count_3m ?? 0) > 0) {
    labels.push("최근 거래 활발");
  }

  return labels;
}

export async function GET(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    const params = req.nextUrl.searchParams;
    const exactOnly = parseExactOnly(params);
    const q = params.get("q")?.trim();

    const input = querySchema.parse({
      q: q && q.length > 0 ? q : undefined,
      region: params.get("region") ?? undefined,
      min_price: params.get("min_price") ?? undefined,
      max_price: params.get("max_price") ?? undefined,
      sw_lat: params.get("sw_lat") ?? undefined,
      sw_lng: params.get("sw_lng") ?? undefined,
      ne_lat: params.get("ne_lat") ?? undefined,
      ne_lng: params.get("ne_lng") ?? undefined,
      limit: params.get("limit") ?? 8
    });

    if (!hasDatabaseUrl()) {
      return NextResponse.json({
        ok: true,
        source: "fallback",
        sourceLabel: SOURCE_LABEL,
        updatedAt: null,
        query: { ...input, exact_only: exactOnly },
        count: 0,
        recommendations: []
      });
    }

    const pool = getDbPool();
    const like = input.q ? `%${input.q}%` : null;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.apt_name,
        c.legal_dong,
        c.location_source,
        r.code AS region_code,
        r.name_ko AS region_name,
        latest.deal_amount_manwon,
        latest.deal_date,
        stats.deal_count_3m,
        CASE
          WHEN $2::VARCHAR IS NOT NULL AND r.code = $2 THEN true
          ELSE false
        END AS same_region_score,
        CASE
          WHEN ($3::INT IS NOT NULL OR $4::INT IS NOT NULL)
            AND latest.deal_amount_manwon IS NOT NULL
            AND ($3::INT IS NULL OR latest.deal_amount_manwon >= $3)
            AND ($4::INT IS NULL OR latest.deal_amount_manwon <= $4)
          THEN true
          ELSE false
        END AS similar_price_score,
        CASE
          WHEN COALESCE(stats.deal_count_3m, 0) >= 3 THEN true
          ELSE false
        END AS active_deals_score,
        (
          CASE
            WHEN $2::VARCHAR IS NOT NULL AND r.code = $2 THEN 40
            ELSE 0
          END
          + CASE
              WHEN ($3::INT IS NOT NULL OR $4::INT IS NOT NULL)
                AND latest.deal_amount_manwon IS NOT NULL
                AND ($3::INT IS NULL OR latest.deal_amount_manwon >= $3)
                AND ($4::INT IS NULL OR latest.deal_amount_manwon <= $4)
              THEN 30
              ELSE 0
            END
          + CASE
              WHEN COALESCE(stats.deal_count_3m, 0) >= 3 THEN 20
              WHEN COALESCE(stats.deal_count_3m, 0) >= 1 THEN 10
              ELSE 0
            END
          + CASE
              WHEN latest.deal_date >= (CURRENT_DATE - INTERVAL '30 days') THEN 10
              WHEN latest.deal_date >= (CURRENT_DATE - INTERVAL '90 days') THEN 5
              ELSE 0
            END
        ) AS recommendation_score
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
      WHERE
        ($1::TEXT IS NULL OR c.apt_name ILIKE $1 OR c.legal_dong ILIKE $1)
        AND ($2::VARCHAR IS NULL OR r.code = $2)
        AND ($3::INT IS NULL OR latest.deal_amount_manwon >= $3)
        AND ($4::INT IS NULL OR latest.deal_amount_manwon <= $4)
        AND ($5::BOOLEAN = false OR c.location_source = 'exact')
        AND (
          $6::DOUBLE PRECISION IS NULL
          OR $7::DOUBLE PRECISION IS NULL
          OR $8::DOUBLE PRECISION IS NULL
          OR $9::DOUBLE PRECISION IS NULL
          OR (
            c.location IS NOT NULL
            AND ST_Intersects(c.location, ST_MakeEnvelope($7, $6, $9, $8, 4326))
          )
        )
      ORDER BY recommendation_score DESC, stats.deal_count_3m DESC, latest.deal_date DESC NULLS LAST, c.id DESC
      LIMIT $10
    `,
      [
        like,
        input.region ?? null,
        input.min_price ?? null,
        input.max_price ?? null,
        exactOnly,
        input.sw_lat ?? null,
        input.sw_lng ?? null,
        input.ne_lat ?? null,
        input.ne_lng ?? null,
        input.limit
      ]
    );

    const recommendations = result.rows.map((row) => {
      const locationQuality = row.location_source === "exact" ? "exact" : "approx";
      return {
        id: String(row.id),
        aptName: String(row.apt_name ?? ""),
        legalDong: String(row.legal_dong ?? ""),
        regionCode: String(row.region_code ?? ""),
        regionName: String(row.region_name ?? ""),
        dealAmountManwon: row.deal_amount_manwon === null ? null : Number(row.deal_amount_manwon),
        dealDate: row.deal_date ? new Date(row.deal_date).toISOString() : null,
        dealCount3m: Number(row.deal_count_3m ?? 0),
        locationQuality,
        reasonLabels: toReasonLabels(row)
      };
    });

    const latestTs = recommendations.reduce((maxTs, item) => Math.max(maxTs, toTimestamp(item.dealDate)), 0);

    return NextResponse.json({
      ok: true,
      source: "database",
      sourceLabel: SOURCE_LABEL,
      updatedAt: latestTs > 0 ? new Date(latestTs).toISOString() : null,
      query: { ...input, exact_only: exactOnly },
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    logApiError("GET /api/hub/recommendations", error);
    status = 400;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/hub/recommendations", performance.now() - started, status);
  }
}
