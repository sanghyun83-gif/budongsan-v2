import { NextRequest, NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const SOURCE_LABEL = "국토교통부 실거래가 공개데이터";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

function parseLimit(params: URLSearchParams): number {
  const raw = Number(params.get("limit") ?? DEFAULT_LIMIT);
  if (!Number.isFinite(raw)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(raw)));
}

function toTimestamp(value: unknown): number {
  if (!value) return 0;
  const ts = new Date(String(value)).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export async function GET(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    const limit = parseLimit(req.nextUrl.searchParams);

    if (!hasDatabaseUrl()) {
      return NextResponse.json({
        ok: true,
        source: "fallback",
        sourceLabel: SOURCE_LABEL,
        updatedAt: null,
        snapshot: {
          recentDeals: [],
          summary: {
            recentCount: 0,
            previousCount: 0,
            countDiff: 0,
            recentMedianPriceManwon: null,
            previousMedianPriceManwon: null,
            medianPriceDiffManwon: null,
            medianPriceDiffPct: null
          }
        }
      });
    }

    const pool = getDbPool();

    const [recentDealsRes, summaryRes] = await Promise.all([
      pool.query(
        `
        SELECT
          d.id,
          d.complex_id,
          c.apt_name,
          c.legal_dong,
          r.code AS region_code,
          r.name_ko AS region_name,
          d.deal_date,
          d.deal_amount_manwon,
          d.area_m2,
          d.floor
        FROM deal_trade_normalized d
        JOIN complex c ON c.id = d.complex_id
        JOIN region r ON r.id = c.region_id
        ORDER BY d.deal_date DESC, d.id DESC
        LIMIT $1
      `,
        [limit]
      ),
      pool.query(`
        WITH recent AS (
          SELECT deal_amount_manwon
          FROM deal_trade_normalized
          WHERE deal_date >= (CURRENT_DATE - INTERVAL '30 days')
        ),
        previous AS (
          SELECT deal_amount_manwon
          FROM deal_trade_normalized
          WHERE deal_date < (CURRENT_DATE - INTERVAL '30 days')
            AND deal_date >= (CURRENT_DATE - INTERVAL '60 days')
        ),
        recent_agg AS (
          SELECT
            COUNT(*)::INT AS cnt,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY deal_amount_manwon)::NUMERIC AS median_price
          FROM recent
        ),
        previous_agg AS (
          SELECT
            COUNT(*)::INT AS cnt,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY deal_amount_manwon)::NUMERIC AS median_price
          FROM previous
        ),
        latest AS (
          SELECT MAX(deal_date)::TIMESTAMPTZ AS max_deal_date
          FROM deal_trade_normalized
        )
        SELECT
          r.cnt AS recent_count,
          p.cnt AS previous_count,
          (r.cnt - p.cnt)::INT AS count_diff,
          r.median_price AS recent_median_price,
          p.median_price AS previous_median_price,
          CASE
            WHEN r.median_price IS NOT NULL AND p.median_price IS NOT NULL
            THEN (r.median_price - p.median_price)
            ELSE NULL
          END AS median_diff_price,
          CASE
            WHEN p.median_price IS NOT NULL AND p.median_price != 0
            THEN ((r.median_price - p.median_price) / p.median_price) * 100
            ELSE NULL
          END AS median_diff_pct,
          l.max_deal_date
        FROM recent_agg r
        CROSS JOIN previous_agg p
        CROSS JOIN latest l
      `)
    ]);

    const recentDeals = recentDealsRes.rows.map((row) => ({
      id: Number(row.id),
      complexId: Number(row.complex_id),
      aptName: String(row.apt_name ?? ""),
      legalDong: String(row.legal_dong ?? ""),
      regionCode: String(row.region_code ?? ""),
      regionName: String(row.region_name ?? ""),
      dealDate: row.deal_date ? new Date(row.deal_date).toISOString() : null,
      dealAmountManwon: row.deal_amount_manwon === null ? null : Number(row.deal_amount_manwon),
      areaM2: row.area_m2 === null ? null : Number(row.area_m2),
      floor: row.floor === null ? null : Number(row.floor)
    }));

    const summaryRow = summaryRes.rows[0] ?? {};
    const recentMedian = summaryRow.recent_median_price === null ? null : Number(summaryRow.recent_median_price);
    const previousMedian =
      summaryRow.previous_median_price === null ? null : Number(summaryRow.previous_median_price);
    const medianDiff = summaryRow.median_diff_price === null ? null : Number(summaryRow.median_diff_price);
    const medianDiffPct = summaryRow.median_diff_pct === null ? null : Number(summaryRow.median_diff_pct);

    const latestTs = Math.max(
      toTimestamp(summaryRow.max_deal_date),
      ...recentDeals.map((item) => toTimestamp(item.dealDate))
    );

    return NextResponse.json({
      ok: true,
      source: "database",
      sourceLabel: SOURCE_LABEL,
      updatedAt: latestTs > 0 ? new Date(latestTs).toISOString() : null,
      snapshot: {
        recentDeals,
        summary: {
          recentCount: Number(summaryRow.recent_count ?? 0),
          previousCount: Number(summaryRow.previous_count ?? 0),
          countDiff: Number(summaryRow.count_diff ?? 0),
          recentMedianPriceManwon: recentMedian,
          previousMedianPriceManwon: previousMedian,
          medianPriceDiffManwon: medianDiff,
          medianPriceDiffPct: medianDiffPct === null ? null : Number(medianDiffPct.toFixed(1))
        }
      }
    });
  } catch (error) {
    logApiError("GET /api/hub/snapshot", error);
    status = 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/hub/snapshot", performance.now() - started, status);
  }
}
