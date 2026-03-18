import { NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const SOURCE_LABEL = "국토교통부 실거래가 공개데이터";
const TOP_COMPLEX_LIMIT = 6;
const RISING_KEYWORD_LIMIT = 8;
const RISING_KEYWORD_CANDIDATES = [
  "래미안",
  "자이",
  "힐스테이트",
  "아이파크",
  "푸르지오",
  "더샵",
  "롯데캐슬",
  "e편한세상",
  "센트럴",
  "리버",
  "센트럴뷰",
  "파크"
];

function toTimestamp(value: unknown): number {
  if (!value) return 0;
  const ts = new Date(String(value)).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export async function GET() {
  const started = performance.now();
  let status = 200;

  try {
    if (!hasDatabaseUrl()) {
      return NextResponse.json({
        ok: true,
        source: "fallback",
        sourceLabel: SOURCE_LABEL,
        updatedAt: null,
        trends: {
          topComplexes: [],
          risingKeywords: []
        }
      });
    }

    const pool = getDbPool();

    const [topComplexRes, keywordRes] = await Promise.all([
      pool.query(
        `
        SELECT
          c.id,
          c.apt_name,
          c.legal_dong,
          r.name_ko AS region_name,
          stats.deal_count_3m,
          latest.deal_date AS latest_deal_date,
          latest.deal_amount_manwon AS latest_deal_amount_manwon
        FROM complex c
        JOIN region r ON r.id = c.region_id
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::INT AS deal_count_3m
          FROM deal_trade_normalized d
          WHERE d.complex_id = c.id
            AND d.deal_date >= (CURRENT_DATE - INTERVAL '3 months')
        ) stats ON true
        LEFT JOIN LATERAL (
          SELECT d.deal_date, d.deal_amount_manwon
          FROM deal_trade_normalized d
          WHERE d.complex_id = c.id
          ORDER BY d.deal_date DESC
          LIMIT 1
        ) latest ON true
        WHERE COALESCE(stats.deal_count_3m, 0) > 0
        ORDER BY stats.deal_count_3m DESC, latest.deal_date DESC NULLS LAST, c.id DESC
        LIMIT $1
      `,
        [TOP_COMPLEX_LIMIT]
      ),
      pool.query(
        `
        WITH keyword_list AS (
          SELECT UNNEST($1::TEXT[]) AS keyword
        ),
        keyword_counts AS (
          SELECT
            kl.keyword,
            COUNT(*) FILTER (WHERE d.deal_date >= (CURRENT_DATE - INTERVAL '30 days'))::INT AS recent_count,
            COUNT(*) FILTER (
              WHERE d.deal_date >= (CURRENT_DATE - INTERVAL '60 days')
                AND d.deal_date < (CURRENT_DATE - INTERVAL '30 days')
            )::INT AS previous_count
          FROM keyword_list kl
          JOIN complex c
            ON c.apt_name ILIKE '%' || kl.keyword || '%'
          JOIN deal_trade_normalized d
            ON d.complex_id = c.id
           AND d.deal_date >= (CURRENT_DATE - INTERVAL '60 days')
          GROUP BY kl.keyword
        )
        SELECT
          keyword,
          recent_count,
          previous_count,
          (recent_count - previous_count)::INT AS growth_count
        FROM keyword_counts
        WHERE recent_count > 0 OR previous_count > 0
        ORDER BY growth_count DESC, recent_count DESC, keyword ASC
        LIMIT $2
      `,
        [RISING_KEYWORD_CANDIDATES, RISING_KEYWORD_LIMIT]
      )
    ]);

    const topComplexes = topComplexRes.rows.map((row) => ({
      id: String(row.id),
      aptName: String(row.apt_name ?? ""),
      legalDong: String(row.legal_dong ?? ""),
      regionName: String(row.region_name ?? ""),
      dealCount3m: Number(row.deal_count_3m ?? 0),
      latestDealDate: row.latest_deal_date ? new Date(row.latest_deal_date).toISOString() : null,
      latestDealAmountManwon:
        row.latest_deal_amount_manwon === null ? null : Number(row.latest_deal_amount_manwon)
    }));

    const risingKeywords = keywordRes.rows.map((row) => {
      const recentCount = Number(row.recent_count ?? 0);
      const previousCount = Number(row.previous_count ?? 0);
      const growthCount = Number(row.growth_count ?? 0);
      const growthRatePct =
        previousCount > 0 ? Number(((growthCount / previousCount) * 100).toFixed(1)) : null;

      return {
        keyword: String(row.keyword ?? ""),
        recentCount,
        previousCount,
        growthCount,
        growthRatePct
      };
    });

    const updatedAtTs = topComplexes.reduce((maxTs, item) => {
      return Math.max(maxTs, toTimestamp(item.latestDealDate));
    }, 0);

    return NextResponse.json({
      ok: true,
      source: "database",
      sourceLabel: SOURCE_LABEL,
      updatedAt: updatedAtTs > 0 ? new Date(updatedAtTs).toISOString() : null,
      trends: {
        topComplexes,
        risingKeywords
      }
    });
  } catch (error) {
    logApiError("GET /api/hub/trends", error);
    status = 500;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/hub/trends", performance.now() - started, status);
  }
}
