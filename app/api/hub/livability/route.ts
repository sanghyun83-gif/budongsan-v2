import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const SOURCE_LABEL = "국토교통부 실거래가 공개데이터 + 내부 좌표 집계(1차)";
const METHOD_NOTE =
  "생활 인프라 1차 버전은 내부 좌표/거래 밀도 기반 추정치입니다. 실제 교통/학군/상권 데이터와 차이가 있을 수 있습니다.";

const querySchema = z.object({
  complex_id: z.coerce.number().int().positive()
});

type LivabilityLabel = "좋음" | "보통" | "아쉬움" | "데이터 준비중";

function toLabel(score: number, thresholds: { good: number; normal: number }): LivabilityLabel {
  if (!Number.isFinite(score)) return "데이터 준비중";
  if (score >= thresholds.good) return "좋음";
  if (score >= thresholds.normal) return "보통";
  return "아쉬움";
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export async function GET(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    const params = req.nextUrl.searchParams;
    const input = querySchema.parse({
      complex_id: params.get("complex_id")
    });

    if (!hasDatabaseUrl()) {
      return NextResponse.json({
        ok: true,
        source: "fallback",
        sourceLabel: SOURCE_LABEL,
        updatedAt: null,
        methodNote: METHOD_NOTE,
        complex: null,
        livability: {
          traffic: { label: "데이터 준비중", metric: "-", detail: "DB 연결 필요" },
          education: { label: "데이터 준비중", metric: "-", detail: "DB 연결 필요" },
          convenience: { label: "데이터 준비중", metric: "-", detail: "DB 연결 필요" }
        }
      });
    }

    const pool = getDbPool();
    const result = await pool.query(
      `
      WITH target AS (
        SELECT c.id, c.apt_name, c.legal_dong, c.region_id, c.updated_at, c.location
        FROM complex c
        WHERE c.id = $1
        LIMIT 1
      ),
      region_info AS (
        SELECT r.code AS region_code, r.name_ko AS region_name
        FROM region r
        JOIN target t ON r.id = t.region_id
      ),
      nearby AS (
        SELECT
          COUNT(*) FILTER (
            WHERE c.location IS NOT NULL
              AND t.location IS NOT NULL
              AND ST_DWithin(c.location::geography, t.location::geography, 800)
              AND c.id <> t.id
          )::INT AS nearby_800,
          COUNT(*) FILTER (
            WHERE c.location IS NOT NULL
              AND t.location IS NOT NULL
              AND ST_DWithin(c.location::geography, t.location::geography, 1500)
              AND c.id <> t.id
          )::INT AS nearby_1500
        FROM complex c
        CROSS JOIN target t
      ),
      target_deal AS (
        SELECT
          COUNT(*) FILTER (WHERE d.deal_date >= (CURRENT_DATE - INTERVAL '3 months'))::INT AS target_deal_3m,
          MAX(d.deal_date) AS target_latest_deal_date
        FROM deal_trade_normalized d
        JOIN target t ON d.complex_id = t.id
      ),
      region_deal AS (
        SELECT
          COUNT(*) FILTER (
            WHERE d.deal_date >= (CURRENT_DATE - INTERVAL '12 months')
          )::INT AS region_total_12m,
          COUNT(*) FILTER (
            WHERE d.deal_date >= (CURRENT_DATE - INTERVAL '12 months')
              AND d.area_m2 >= 84
          )::INT AS region_family_12m
        FROM deal_trade_normalized d
        JOIN complex c ON c.id = d.complex_id
        JOIN target t ON c.region_id = t.region_id
      )
      SELECT
        t.id,
        t.apt_name,
        t.legal_dong,
        ri.region_code,
        ri.region_name,
        t.updated_at,
        n.nearby_800,
        n.nearby_1500,
        td.target_deal_3m,
        td.target_latest_deal_date,
        rd.region_total_12m,
        rd.region_family_12m
      FROM target t
      JOIN region_info ri ON true
      JOIN nearby n ON true
      JOIN target_deal td ON true
      JOIN region_deal rd ON true
      `,
      [input.complex_id]
    );

    if (result.rowCount === 0) {
      status = 404;
      return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Complex not found" }, { status });
    }

    const row = result.rows[0];

    const nearby800 = Number(row.nearby_800 ?? 0);
    const nearby1500 = Number(row.nearby_1500 ?? 0);
    const targetDeal3m = Number(row.target_deal_3m ?? 0);
    const regionTotal12m = Number(row.region_total_12m ?? 0);
    const regionFamily12m = Number(row.region_family_12m ?? 0);
    const regionFamilyRatio = regionTotal12m > 0 ? regionFamily12m / regionTotal12m : NaN;

    const trafficLabel = toLabel(nearby800, { good: 120, normal: 40 });
    const convenienceLabel = toLabel(nearby1500 + targetDeal3m * 3, { good: 250, normal: 90 });
    const educationLabel =
      regionTotal12m >= 50 ? toLabel(regionFamilyRatio * 100, { good: 35, normal: 22 }) : "데이터 준비중";

    const latestTs = Math.max(
      row.updated_at ? new Date(row.updated_at).getTime() : 0,
      row.target_latest_deal_date ? new Date(row.target_latest_deal_date).getTime() : 0
    );

    return NextResponse.json({
      ok: true,
      source: "database",
      sourceLabel: SOURCE_LABEL,
      updatedAt: latestTs > 0 ? new Date(latestTs).toISOString() : null,
      methodNote: METHOD_NOTE,
      complex: {
        id: Number(row.id),
        aptName: String(row.apt_name ?? ""),
        legalDong: String(row.legal_dong ?? ""),
        regionCode: String(row.region_code ?? ""),
        regionName: String(row.region_name ?? "")
      },
      livability: {
        traffic: {
          label: trafficLabel,
          metric: `반경 800m 단지 ${nearby800.toLocaleString()}곳`,
          detail: "주변 단지 밀집도가 높을수록 교통 접근성이 높다고 가정한 추정치"
        },
        education: {
          label: educationLabel,
          metric:
            regionTotal12m >= 50
              ? `권역 84㎡+ 거래 비중 ${percent(regionFamilyRatio)}`
              : "권역 거래 데이터 부족",
          detail: "가족형(84㎡+) 거래 비중을 교육 수요 대리 지표로 사용"
        },
        convenience: {
          label: convenienceLabel,
          metric: `반경 1.5km 단지 ${nearby1500.toLocaleString()}곳 · 최근 3개월 ${targetDeal3m.toLocaleString()}건`,
          detail: "주변 주거 밀집 + 최근 거래 활동을 편의성 대리 지표로 사용"
        }
      }
    });
  } catch (error) {
    logApiError("GET /api/hub/livability", error);
    status = 400;
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/hub/livability", performance.now() - started, status);
  }
}

