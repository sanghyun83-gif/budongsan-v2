import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const sortSchema = z.enum(["latest", "price_desc", "price_asc", "deal_count"]);

const querySchema = z.object({
  q: z.string().trim().min(1).max(80),
  region: z.string().regex(/^\d{5}$/).optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  sw_lat: z.coerce.number().min(-90).max(90).optional(),
  sw_lng: z.coerce.number().min(-180).max(180).optional(),
  ne_lat: z.coerce.number().min(-90).max(90).optional(),
  ne_lng: z.coerce.number().min(-180).max(180).optional(),
  sort: sortSchema.default("latest"),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20)
});

const ORDER_BY: Record<z.infer<typeof sortSchema>, string> = {
  latest: "latest.deal_date DESC NULLS LAST, scored.rank_score DESC, c.id DESC",
  price_desc: "latest.deal_amount_manwon DESC NULLS LAST, scored.rank_score DESC, c.id DESC",
  price_asc: "latest.deal_amount_manwon ASC NULLS LAST, scored.rank_score DESC, c.id DESC",
  deal_count: "stats.deal_count_3m DESC, latest.deal_date DESC NULLS LAST, c.id DESC"
};

export async function GET(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    if (!hasDatabaseUrl()) {
      status = 503;
      return NextResponse.json(
        {
          ok: false,
          code: "DB_NOT_CONFIGURED",
          error: "DATABASE_URL is not configured"
        },
        { status }
      );
    }

    const params = req.nextUrl.searchParams;
    const input = querySchema.parse({
      q: params.get("q"),
      region: params.get("region") ?? undefined,
      min_price: params.get("min_price") ?? undefined,
      max_price: params.get("max_price") ?? undefined,
      sw_lat: params.get("sw_lat") ?? undefined,
      sw_lng: params.get("sw_lng") ?? undefined,
      ne_lat: params.get("ne_lat") ?? undefined,
      ne_lng: params.get("ne_lng") ?? undefined,
      sort: params.get("sort") ?? "latest",
      page: params.get("page") ?? 1,
      size: params.get("size") ?? 20
    });

    const offset = (input.page - 1) * input.size;
    const pool = getDbPool();
    const orderBy = ORDER_BY[input.sort];

    const sql = `
      SELECT
        c.id,
        c.apt_name,
        c.legal_dong,
        r.code AS region_code,
        r.name_ko AS region_name,
        ST_Y(c.location::geometry) AS lat,
        ST_X(c.location::geometry) AS lng,
        latest.deal_amount_manwon,
        latest.deal_date,
        stats.deal_count_3m,
        COUNT(*) OVER() AS total_count
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
        SELECT
          CASE
            WHEN c.apt_name ILIKE $11 THEN 300
            WHEN c.legal_dong ILIKE $11 THEN 250
            WHEN c.apt_name ILIKE $1 THEN 180
            WHEN c.legal_dong ILIKE $1 THEN 140
            ELSE 0
          END
          + CASE
            WHEN latest.deal_date >= (CURRENT_DATE - INTERVAL '30 days') THEN 40
            WHEN latest.deal_date >= (CURRENT_DATE - INTERVAL '90 days') THEN 20
            ELSE 0
          END AS rank_score
      ) scored
      WHERE
        (c.apt_name ILIKE $1 OR c.legal_dong ILIKE $1)
        AND ($2::VARCHAR IS NULL OR r.code = $2)
        AND ($3::INT IS NULL OR latest.deal_amount_manwon >= $3)
        AND ($4::INT IS NULL OR latest.deal_amount_manwon <= $4)
        AND (
          $7::DOUBLE PRECISION IS NULL
          OR $8::DOUBLE PRECISION IS NULL
          OR $9::DOUBLE PRECISION IS NULL
          OR $10::DOUBLE PRECISION IS NULL
          OR (
            c.location IS NOT NULL
            AND ST_Intersects(
              c.location,
              ST_MakeEnvelope($8, $7, $10, $9, 4326)
            )
          )
        )
      ORDER BY ${orderBy}
      LIMIT $5 OFFSET $6
    `;

    const like = `%${input.q}%`;
    const exact = input.q;

    const result = await pool.query(sql, [
      like,
      input.region ?? null,
      input.min_price ?? null,
      input.max_price ?? null,
      input.size,
      offset,
      input.sw_lat ?? null,
      input.sw_lng ?? null,
      input.ne_lat ?? null,
      input.ne_lng ?? null,
      exact
    ]);

    const totalCount = result.rows.length > 0 ? Number(result.rows[0].total_count ?? 0) : 0;

    return NextResponse.json({
      ok: true,
      query: input,
      appliedSort: input.sort,
      count: result.rows.length,
      totalCount,
      sourceLabel: "MOLIT Public Real Transaction Data",
      updatedAt: new Date().toISOString(),
      items: result.rows
    });
  } catch (error) {
    logApiError("GET /api/search", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = 400;
    return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/search", performance.now() - started, status);
  }
}
