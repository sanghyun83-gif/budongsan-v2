import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const querySchema = z.object({
  q: z.string().trim().min(1).max(80),
  region: z.string().regex(/^\d{5}$/).optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  sw_lat: z.coerce.number().min(-90).max(90).optional(),
  sw_lng: z.coerce.number().min(-180).max(180).optional(),
  ne_lat: z.coerce.number().min(-90).max(90).optional(),
  ne_lng: z.coerce.number().min(-180).max(180).optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20)
});

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
      page: params.get("page") ?? 1,
      size: params.get("size") ?? 20
    });

    const offset = (input.page - 1) * input.size;
    const pool = getDbPool();

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.apt_name,
        c.legal_dong,
        r.code AS region_code,
        r.name_ko AS region_name,
        ST_Y(c.location::geometry) AS lat,
        ST_X(c.location::geometry) AS lng,
        latest.deal_amount_manwon,
        latest.deal_date
      FROM complex c
      JOIN region r ON r.id = c.region_id
      LEFT JOIN LATERAL (
        SELECT d.deal_amount_manwon, d.deal_date
        FROM deal_trade_normalized d
        WHERE d.complex_id = c.id
        ORDER BY d.deal_date DESC
        LIMIT 1
      ) latest ON true
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
      ORDER BY latest.deal_date DESC NULLS LAST, c.id DESC
      LIMIT $5 OFFSET $6
      `,
      [
        `%${input.q}%`,
        input.region ?? null,
        input.min_price ?? null,
        input.max_price ?? null,
        input.size,
        offset,
        input.sw_lat ?? null,
        input.sw_lng ?? null,
        input.ne_lat ?? null,
        input.ne_lng ?? null
      ]
    );

    return NextResponse.json({
      ok: true,
      query: input,
      count: result.rows.length,
      sourceLabel: "국토교통부 실거래가 공개데이터",
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

