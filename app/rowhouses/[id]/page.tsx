import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ComplexListingsTab from "@/components/ComplexListingsTab";
import DetailActionBar from "@/components/DetailActionBar";
import FinanceEstimateCard from "@/components/FinanceEstimateCard";
import LivabilitySummaryCard from "@/components/LivabilitySummaryCard";
import TradeChartPanel from "@/components/TradeChartPanel";
import ComplexDealTypePanel from "@/components/ComplexDealTypePanel";
import { getRowhouseDealsById, getRowhouseRentDealsById, getRowhouseSummaryById, getRowhouseTrendDealsById } from "@/lib/rowhouses";
import type { TrendDealItem } from "@/lib/rowhouses";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; trend?: string; area?: string; dealType?: string }>;
}

type DetailTab = "price" | "listings" | "info";
type TrendWindow = "3m" | "6m" | "1y" | "all";
type DealTypeParam = "sale" | "jeonse" | "wolse";
const KST_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

function buildComplexTitle(aptName: string): string {
  return `${aptName} 실거래가·시세`;
}

function normalizeDetailTab(raw?: string): DetailTab {
  if (raw === "listings" || raw === "info") return raw;
  return "price";
}

function formatLatestDealDate(date: string | null): string {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("ko-KR");
}

function buildComplexSummarySnippet(
  legalDong: string,
  aptName: string,
  latestDealDate: string | null,
  latestDealAmount: number | null,
  dealCount3m: number
): string {
  return `${legalDong} ${aptName} 연립·다세대의 매매·전세·월세 실거래가와 시세를 제공합니다. 최근 거래일은 ${formatLatestDealDate(latestDealDate)}, 최근 거래가는 ${formatManwon(latestDealAmount)}, 최근 3개월 거래량은 ${dealCount3m}건입니다.`;
}


export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const complexId = Number(id);
  if (!Number.isInteger(complexId) || complexId <= 0) return {};

  const complex = await getRowhouseSummaryById(complexId);
  if (!complex) return {};

  const title = `${buildComplexTitle(complex.aptName)} | ${complex.legalDong} 매매·전세·월세`;
  const summarySnippet = buildComplexSummarySnippet(
    complex.legalDong,
    complex.aptName,
    complex.latestDealDate,
    complex.latestDealAmount,
    complex.dealCount3m
  );
  const socialTitle = `${buildComplexTitle(complex.aptName)} | ${complex.legalDong} 연립·다세대 | 살집`;

  return {
    title,
    description: summarySnippet,
    alternates: { canonical: `https://saljip.kr/rowhouses/${id}` },
    openGraph: {
      title: socialTitle,
      description: summarySnippet,
      url: `https://saljip.kr/rowhouses/${id}`,
      type: "website",
      siteName: "살집",
      locale: "ko_KR",
      images: [{ url: "https://saljip.kr/og-default.png", width: 1200, height: 630, alt: "살집" }]
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: summarySnippet,
      images: ["https://saljip.kr/og-default.png"]
    }
  };
}

function formatManwon(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${value.toLocaleString()}만원`;
}

function formatKstDateTime(input: string): string {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "-";
  return KST_DATE_TIME_FORMATTER.format(parsed);
}

function sanitizeRegionName(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  if (/^\d{5}$/.test(value)) return "";
  if (/^지역\s*\d{5}$/.test(value)) return "";
  return value;
}

function formatRegionText(regionName: string | null | undefined, legalDong: string | null | undefined): string {
  const parts = [sanitizeRegionName(regionName), (legalDong ?? "").trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "지역 정보 없음";
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function normalizeTrendWindow(raw?: string): TrendWindow {
  if (raw === "3m" || raw === "6m" || raw === "1y" || raw === "all") return raw;
  return "1y";
}

function getTrendDays(windowKey: TrendWindow): number | null {
  if (windowKey === "3m") return 90;
  if (windowKey === "6m") return 180;
  if (windowKey === "1y") return 365;
  return null;
}

function computeSaleTrend(deals: TrendDealItem[], days: number | null) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const recent = deals.filter((d) => {
    const ts = new Date(d.dealDate).getTime();
    if (!Number.isFinite(ts)) return false;
    if (days === null) return true;
    return ts >= now - days * dayMs;
  });

  const previous = days === null
    ? []
    : deals.filter((d) => {
        const ts = new Date(d.dealDate).getTime();
        if (!Number.isFinite(ts)) return false;
        return ts >= now - days * 2 * dayMs && ts < now - days * dayMs;
      });

  const recentAvg = average(recent.map((d) => d.dealAmountManwon));
  const previousAvg = average(previous.map((d) => d.dealAmountManwon));
  const countDiff = previous.length > 0 ? recent.length - previous.length : 0;
  const countDiffPct = previous.length > 0 ? (countDiff / previous.length) * 100 : null;
  const avgDiff = previousAvg !== null && recentAvg !== null ? recentAvg - previousAvg : null;
  const avgDiffPct = previousAvg && avgDiff !== null ? (avgDiff / previousAvg) * 100 : null;

  return { recentCount: recent.length, recentAvg, countDiff, countDiffPct, avgDiff, avgDiffPct };
}

function normalizeDealType(raw?: string): DealTypeParam {
  if (raw === "jeonse" || raw === "wolse") return raw;
  return "sale";
}

function buildTrendHref(complexId: number, trend: TrendWindow, area: string, dealType: DealTypeParam): string {
  const sp = new URLSearchParams();
  if (trend !== "1y") sp.set("trend", trend);
  if (area !== "all") sp.set("area", area);
  if (dealType !== "sale") sp.set("dealType", dealType);
  return `/rowhouses/${complexId}${sp.toString() ? `?${sp.toString()}` : ""}`;
}

function buildTabHref(complexId: number, tab: DetailTab, trend: TrendWindow, area: string, dealType: DealTypeParam) {
  const sp = new URLSearchParams();
  if (tab !== "price") sp.set("tab", tab);
  if (trend !== "1y") sp.set("trend", trend);
  if (area !== "all") sp.set("area", area);
  if (dealType !== "sale") sp.set("dealType", dealType);
  return `/rowhouses/${complexId}${sp.toString() ? `?${sp.toString()}` : ""}`;
}

function buildRawHref(complexId: number, tab?: string, trend?: string, area?: string, dealType?: string) {
  const sp = new URLSearchParams();
  if (tab) sp.set("tab", tab);
  if (trend) sp.set("trend", trend);
  if (area) sp.set("area", area);
  if (dealType) sp.set("dealType", dealType);
  return `/rowhouses/${complexId}${sp.toString() ? `?${sp.toString()}` : ""}`;
}

function toJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildPriceChartStructuredData(input: {
  complexId: number;
  aptName: string;
  legalDong: string;
  pageUrl: string;
  selectedArea: string;
  trendWindow: TrendWindow;
  deals: TrendDealItem[];
  updatedAt: string;
}) {
  const areaLabel = input.selectedArea === "all" ? "전체 전용면적" : `${input.selectedArea}㎡`;
  const sortedDates = input.deals
    .map((d) => new Date(d.dealDate))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const temporalCoverage = sortedDates.length > 0
    ? `${sortedDates[0].toISOString().slice(0, 10)}/${sortedDates[sortedDates.length - 1].toISOString().slice(0, 10)}`
    : undefined;

  const datasetId = `${input.pageUrl}#dataset-sale-trend`;
  const webPageId = `${input.pageUrl}#webpage`;
  const name = `${input.aptName} ${areaLabel} 연립·다세대 매매 실거래가 추이`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": webPageId,
        url: input.pageUrl,
        name: `${input.aptName} 실거래가·시세 | ${input.legalDong} 연립·다세대 | 살집`,
        description: `${input.legalDong} ${input.aptName} 연립·다세대의 ${areaLabel} 매매 실거래가 추이 및 거래량 차트입니다.`,
        inLanguage: "ko-KR",
        isPartOf: {
          "@type": "WebSite",
          name: "살집",
          url: "https://saljip.kr"
        },
        primaryImageOfPage: "https://saljip.kr/og-default.png",
        mainEntity: { "@id": datasetId },
        dateModified: input.updatedAt
      },
      {
        "@type": "Dataset",
        "@id": datasetId,
        name,
        description: `${input.aptName} 연립·다세대 ${areaLabel} 기준 매매 실거래가 및 월별 거래량 데이터셋`,
        url: input.pageUrl,
        isAccessibleForFree: true,
        inLanguage: "ko-KR",
        keywords: [
          input.aptName,
          input.legalDong,
          "연립·다세대 실거래가",
          "매매 실거래가 추이",
          "전용면적별 실거래가",
          "부동산 시세"
        ],
        creator: {
          "@type": "Organization",
          name: "살집"
        },
        publisher: {
          "@type": "Organization",
          name: "살집"
        },
        variableMeasured: ["매매 실거래가", "월별 거래량"],
        measurementTechnique: `기간 필터(${input.trendWindow}) 및 전용면적 필터(${areaLabel}) 기반 집계`,
        temporalCoverage,
        dateModified: input.updatedAt,
        includedInDataCatalog: {
          "@type": "DataCatalog",
          name: "살집 연립·다세대 실거래가 데이터"
        },
        license: "https://www.data.go.kr/"
      }
    ]
  };
}

export default async function ComplexDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab, trend, area, dealType: rawDealType } = await searchParams;
  const activeTab = normalizeDetailTab(tab);
  const dealType = normalizeDealType(rawDealType);

  const complexId = Number(id);
  if (!Number.isInteger(complexId) || complexId <= 0) notFound();

  const complex = await getRowhouseSummaryById(complexId);
  if (!complex) notFound();

  const summarySnippet = buildComplexSummarySnippet(
    complex.legalDong,
    complex.aptName,
    complex.latestDealDate,
    complex.latestDealAmount,
    complex.dealCount3m
  );

  const trendWindow = normalizeTrendWindow(trend);
  const [recentDeals, trendDeals, recentRentDeals] = await Promise.all([
    getRowhouseDealsById(complexId, 1, 20),
    getRowhouseTrendDealsById(complexId, 300),
    getRowhouseRentDealsById(complexId, 200)
  ]);

  const sortedAreaOptions = Array.from(
    new Set(trendDeals.map((d) => Number(d.areaM2.toFixed(2))))
  )
    .sort((a, b) => a - b)
    .map((v) => v.toFixed(2));

  const areaOptions = ["all", ...sortedAreaOptions].slice(0, 12);
  const requestedArea = area?.trim() || "all";
  const selectedArea = activeTab === "price"
    ? (areaOptions.includes(requestedArea) ? requestedArea : "all")
    : (requestedArea === "all" ? "all" : requestedArea);

  const normalizedHref = buildTabHref(complexId, activeTab, trendWindow, selectedArea, dealType);
  const rawHref = buildRawHref(complexId, tab, trend, area, rawDealType);
  if (rawHref !== normalizedHref) {
    redirect(normalizedHref);
  }

  const filteredTrendDeals = selectedArea === "all"
    ? trendDeals
    : trendDeals.filter((d) => d.areaM2.toFixed(2) === selectedArea);
  const saleTrend = computeSaleTrend(filteredTrendDeals, getTrendDays(trendWindow));
  const trendComparisonText = trendWindow === "all"
    ? "전체 기간은 누적 지표만 제공합니다."
    : saleTrend.recentCount === 0
      ? "선택 조건에 해당하는 거래가 없습니다."
      : `직전 동일 기간 대비 거래량 ${saleTrend.countDiff >= 0 ? "+" : ""}${saleTrend.countDiff}건${saleTrend.countDiffPct !== null ? ` (${saleTrend.countDiffPct.toFixed(1)}%)` : ""}, 가격 ${saleTrend.avgDiff !== null ? `${saleTrend.avgDiff >= 0 ? "+" : "-"}${formatManwon(Math.abs(saleTrend.avgDiff))}` : "-"}${saleTrend.avgDiffPct !== null ? ` (${saleTrend.avgDiffPct.toFixed(1)}%)` : ""} 변동.`;

  const tabItems: Array<{ key: DetailTab; label: string }> = [
    { key: "price", label: "시세·실거래" },
    { key: "listings", label: "매물" },
    { key: "info", label: "단지정보" }
  ];

  const pageUrl = `https://saljip.kr${normalizedHref}`;
  const priceChartJsonLd = activeTab === "price"
    ? buildPriceChartStructuredData({
        complexId,
        aptName: complex.aptName,
        legalDong: complex.legalDong,
        pageUrl,
        selectedArea,
        trendWindow,
        deals: filteredTrendDeals,
        updatedAt: complex.updatedAt
      })
    : null;

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 20px", display: "grid", gap: 16 }}>
      {priceChartJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLd(priceChartJsonLd) }}
        />
      )}

      <Link href="/" style={{ color: "#0f766e", textDecoration: "underline", width: "fit-content" }}>
        뒤로
      </Link>

      <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{complex.aptName}</h1>
        <p style={{ color: "#475569", marginTop: 4 }}>{formatRegionText(complex.regionName, complex.legalDong)}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <span className="ui-trust-chip">출처: 국토교통부 실거래가 공개데이터</span>
          <span className="ui-trust-chip">최종 업데이트: {formatKstDateTime(complex.updatedAt)}</span>
        </div>
        <p style={{ color: "#0f172a", marginTop: 10, lineHeight: 1.55 }}>{summarySnippet}</p>
      </section>

      <DetailActionBar complexId={complexId} />

      <section
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 8,
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        }}
        aria-label="단지 상세 탭"
      >
        {tabItems.map((item) => {
          const href = buildTabHref(complexId, item.key, trendWindow, selectedArea, dealType);
          const active = item.key === activeTab;
          return (
            <Link
              key={item.key}
              href={href}
              className="ui-button"
              style={{
                background: active ? "#0f766e" : "#f8fafc",
                color: active ? "#fff" : "#0f172a"
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </section>

      {activeTab === "price" && (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <p style={{ color: "#64748b" }}>최근 거래가</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{formatManwon(complex.latestDealAmount)}</p>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <p style={{ color: "#64748b" }}>최근 거래일</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>
                {complex.latestDealDate ? new Date(complex.latestDealDate).toLocaleDateString("ko-KR") : "-"}
              </p>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <p style={{ color: "#64748b" }}>최근 3개월 거래</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{complex.dealCount3m}건</p>
            </div>
          </section>

          <TradeChartPanel deals={trendDeals} initialArea={selectedArea} complexName={complex.aptName} />

          {saleTrend && (
            <section style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>최근 시세 동향</h2>
                  <p style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>
                    요약: 거래량 {saleTrend.recentCount}건 · 평균 거래가 {formatManwon(saleTrend.recentAvg)} · 변동률 {saleTrend.avgDiffPct !== null ? `${saleTrend.avgDiffPct.toFixed(1)}%` : "-"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["3m", "6m", "1y", "all"] as TrendWindow[]).map((w) => (
                    <Link
                      key={w}
                      href={buildTrendHref(complexId, w, selectedArea, dealType)}
                      className="ui-button"
                      style={{
                        borderRadius: 999,
                        border: trendWindow === w ? "1px solid #0f766e" : "1px solid #cbd5e1",
                        background: trendWindow === w ? "#0f766e" : "#fff",
                        color: trendWindow === w ? "#fff" : "#0f172a",
                        fontWeight: trendWindow === w ? 700 : 500
                      }}
                    >
                      {trendWindow === w ? "● " : ""}
                      {w === "3m" ? "3개월" : w === "6m" ? "6개월" : w === "1y" ? "1년" : "전체"}
                    </Link>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                {areaOptions.map((a) => (
                  <Link
                    key={a}
                    href={buildTrendHref(complexId, trendWindow, a, dealType)}
                    className="ui-button"
                    style={{
                      borderRadius: 999,
                      border: selectedArea === a ? "1px solid #1e293b" : "1px solid #cbd5e1",
                      background: selectedArea === a ? "#1e293b" : "#fff",
                      color: selectedArea === a ? "#fff" : "#0f172a",
                      fontWeight: selectedArea === a ? 700 : 500
                    }}
                  >
                    {selectedArea === a ? "● " : ""}
                    {a === "all" ? "전체 평형" : `${a}m²`}
                  </Link>
                ))}
              </div>

              <ComplexDealTypePanel
                dealType={dealType}
                trendWindow={trendWindow}
                selectedArea={selectedArea}
                saleTrend={saleTrend}
                trendComparisonText={trendComparisonText}
                recentDeals={recentDeals}
                recentRentDeals={recentRentDeals}
              />

            </section>
          )}

          <FinanceEstimateCard
            complexId={complexId}
            aptName={complex.aptName}
            defaultPriceManwon={complex.latestDealAmount}
            noSnippet
          />
        </>
      )}

      {activeTab === "listings" && (
        <>
          <section style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
            <ComplexDealTypePanel
              dealType={dealType}
              trendWindow={trendWindow}
              selectedArea={selectedArea}
              saleTrend={saleTrend}
              trendComparisonText={trendComparisonText}
              recentDeals={recentDeals}
              recentRentDeals={recentRentDeals}
            />
          </section>
          <ComplexListingsTab complexId={complexId} />
        </>
      )}

      {activeTab === "info" && (
        <>
          <section style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
            <ComplexDealTypePanel
              dealType={dealType}
              trendWindow={trendWindow}
              selectedArea={selectedArea}
              saleTrend={saleTrend}
              trendComparisonText={trendComparisonText}
              recentDeals={recentDeals}
              recentRentDeals={recentRentDeals}
            />
          </section>

          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>단지정보</h2>
            <p style={{ color: "#0f172a" }}>출처: 국토교통부 실거래가 공개데이터</p>
            <p style={{ color: "#64748b", marginTop: 4 }}>기준: API 조회 시점 기준</p>
          </section>

          <LivabilitySummaryCard
            complexId={complexId}
            title="생활 인프라 요약"
            subtitle={`${formatRegionText(complex.regionName, complex.legalDong)} 기준`}
          />
        </>
      )}

    </main>
  );
}
