import type { Metadata } from "next";
import Link from "next/link";
import ComplexDealTypePanel from "@/components/ComplexDealTypePanel";
import FinanceEstimateCard from "@/components/FinanceEstimateCard";
import TradeChartPanel from "@/components/TradeChartPanel";
import type { DealHistoryItem, RentHistoryItem, TrendDealItem } from "@/lib/complexes";
import { codeToPropertyType, decodeRouteParams, makeStableKey } from "@/lib/url-key";

type Params = Promise<{ sggCd: string; ptypeCode: string; stableKey: string }>;
type SearchParams = Promise<{ t?: string; tab?: string; trend?: string; area?: string; dealType?: string }>;
type TrendWindow = "3m" | "6m" | "1y" | "all";
type DetailTab = "price" | "listings" | "info";

export async function generateMetadata(
  { params, searchParams }: { params: Params; searchParams: SearchParams }
): Promise<Metadata> {
  const { sggCd, ptypeCode, stableKey } = await params;
  const { t } = await searchParams;
  const canonicalPath = `/deallist/${encodeURIComponent(sggCd)}/${encodeURIComponent(ptypeCode)}/${encodeURIComponent(stableKey)}`;

  let title = "실거래가 상세 | 살집";
  let description = `전국 부동산 실거래가 상세 페이지입니다. (${sggCd})`;

  if (t) {
    try {
      const payload = decodeRouteParams(t, process.env.URL_SIGNING_SECRET);
      const label = toLabel(payload.propertyType);
      const regionText = [payload.sggCd ?? sggCd, payload.umdNm ?? ""].filter(Boolean).join(" ");
      title = `${payload.complexName} ${label} 실거래가 | 살집`;
      description = `${regionText} ${payload.complexName}의 매매·전세·월세 실거래가를 확인하세요.`.trim();
    } catch {}
  }

  return { title, description, alternates: { canonical: `https://saljip.kr${canonicalPath}` } };
}

function toLabel(propertyType: string): string {
  if (propertyType === "dasaedae") return "빌라";
  if (propertyType === "officetel") return "오피스텔";
  return "아파트";
}

function formatRegionText(regionName: string, legalDong: string): string {
  return [regionName, legalDong].filter(Boolean).join(" ");
}

function formatLatestDealDate(date: string | null): string {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("ko-KR");
}

function formatKstDateTime(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false });
}

function buildSummarySnippet(legalDong: string, aptName: string, latestDealDate: string | null, latestDealAmount: number | null, dealCount3m: number): string {
  const amountText = formatManwon(latestDealAmount);
  return `${legalDong} ${aptName}의 매매·전세·월세 실거래가와 시세를 제공합니다. 최근 거래일은 ${formatLatestDealDate(latestDealDate)}, 최근 거래가는 ${amountText}, 최근 3개월 거래량은 ${dealCount3m}건입니다.`;
}

function toNumber(v: unknown): number {
  const n = Number(String(v ?? "").replaceAll(",", "").trim());
  return Number.isFinite(n) ? n : 0;
}

function toIsoDate(y?: string, m?: string, d?: string): string {
  if (!y || !m || !d) return new Date(0).toISOString();
  return new Date(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T00:00:00+09:00`).toISOString();
}

function normalizeTrendWindow(v?: string): TrendWindow {
  if (v === "3m" || v === "6m" || v === "1y") return v;
  return "all";
}

function normalizeTab(v?: string): DetailTab {
  if (v === "listings" || v === "info") return v;
  return "price";
}

function getTrendDays(w: TrendWindow): number | null {
  if (w === "3m") return 90;
  if (w === "6m") return 180;
  if (w === "1y") return 365;
  return null;
}

function formatManwon(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${value.toLocaleString()}만원`;
}

function computeSaleTrend(deals: TrendDealItem[], days: number | null) {
  const now = Date.now();
  const inWindow = (x: TrendDealItem, mult: number) => {
    if (days === null) return true;
    const ts = new Date(x.dealDate).getTime();
    return ts >= now - days * mult * 24 * 60 * 60 * 1000 && ts <= now - days * (mult - 1) * 24 * 60 * 60 * 1000;
  };
  const recent = deals.filter((d) => inWindow(d, 1));
  const prev = days === null ? [] : deals.filter((d) => inWindow(d, 2));
  const avg = (arr: TrendDealItem[]) => (arr.length ? Math.round(arr.reduce((s, x) => s + x.dealAmountManwon, 0) / arr.length) : null);
  const recentAvg = avg(recent);
  const prevAvg = avg(prev);
  const countDiff = recent.length - prev.length;
  const countDiffPct = prev.length > 0 ? (countDiff / prev.length) * 100 : null;
  const avgDiff = recentAvg !== null && prevAvg !== null ? recentAvg - prevAvg : null;
  const avgDiffPct = recentAvg !== null && prevAvg && prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : null;
  return { recentCount: recent.length, recentAvg, countDiff, countDiffPct, avgDiff, avgDiffPct };
}

export default async function DealListPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { sggCd, ptypeCode, stableKey } = await params;
  const { t, tab, trend, area, dealType } = await searchParams;

  if (!t) return <main style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>잘못된 접근입니다. (token 없음)</main>;

  let payload;
  try {
    payload = decodeRouteParams(t, process.env.URL_SIGNING_SECRET);
  } catch {
    return <main style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>잘못된 접근입니다. (token 검증 실패)</main>;
  }

  try {
    if (payload.propertyType !== codeToPropertyType(ptypeCode)) {
      return <main style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>잘못된 접근입니다. (propertyType 불일치)</main>;
    }
  } catch {
    return <main style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>잘못된 접근입니다. (type code 오류)</main>;
  }

  const expectedKey = makeStableKey({
    propertyType: payload.propertyType,
    complexName: payload.complexName,
    sggCd: payload.sggCd,
    umdNm: payload.umdNm,
    jibun: payload.jibun
  });
  if (expectedKey !== stableKey) return <main style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>잘못된 접근입니다. (stableKey 불일치)</main>;

  const apiKey = process.env.SOOTJA_API_KEY ?? process.env.API_KEY;
  const base = process.env.SOOTJA_API_BASE_URL ?? "https://sootja.kr/realestate";
  if (!apiKey) return <main style={{ maxWidth: 920, margin: "0 auto", padding: 16 }}>SOOTJA API 키가 필요합니다.</main>;

  const sp = new URLSearchParams({ api_key: apiKey, property_type: payload.propertyType, complex_name: payload.complexName, page: "1", page_size: "300" });
  if (payload.sggCd) sp.set("sggCd", payload.sggCd);
  if (payload.umdNm) sp.set("umdNm", payload.umdNm);
  if (payload.jibun) sp.set("jibun", payload.jibun);

  const res = await fetch(`${base}/v1/complex/records?${sp.toString()}`, { cache: "no-store" });
  const json = res.ok ? await res.json() : {};
  const tradeItems = Array.isArray(json?.trade?.items) ? json.trade.items : [];
  const rentItems = Array.isArray(json?.rent?.items) ? json.rent.items : [];

  const regionNameFromRows = (tradeItems.find((r: Record<string, string>) => (r.sggnm ?? "").trim())?.sggnm
    ?? rentItems.find((r: Record<string, string>) => (r.sggnm ?? "").trim())?.sggnm
    ?? "").trim();

  const trendDeals: TrendDealItem[] = tradeItems.map((r: Record<string, string>) => ({
    dealDate: toIsoDate(r.dealyear, r.dealmonth, r.dealday),
    dealAmountManwon: toNumber(r.dealamount),
    areaM2: toNumber(r.excluusear)
  }))
    .filter((x: TrendDealItem) => x.dealAmountManwon > 0 && x.areaM2 > 0)
    .sort((a: TrendDealItem, b: TrendDealItem) => new Date(b.dealDate).getTime() - new Date(a.dealDate).getTime());

  const recentDeals: DealHistoryItem[] = tradeItems.map((r: Record<string, string>, i: number) => ({
    id: i + 1,
    dealDate: toIsoDate(r.dealyear, r.dealmonth, r.dealday),
    dealAmountManwon: toNumber(r.dealamount),
    areaM2: toNumber(r.excluusear),
    floor: Number.isFinite(Number(r.floor)) ? Number(r.floor) : null,
    buildYear: Number.isFinite(Number(r.buildyear)) ? Number(r.buildyear) : null
  }))
    .sort((a: DealHistoryItem, b: DealHistoryItem) => new Date(b.dealDate).getTime() - new Date(a.dealDate).getTime())
    .slice(0, 80);

  const recentRentDeals: RentHistoryItem[] = rentItems.map((r: Record<string, string>, i: number) => ({
    id: i + 1,
    dealDate: toIsoDate(r.dealyear, r.dealmonth, r.dealday),
    rentType: toNumber(r.monthlyrent) > 0 ? "wolse" : "jeonse",
    depositManwon: toNumber(r.deposit),
    monthlyRentManwon: toNumber(r.monthlyrent),
    areaM2: toNumber(r.excluusear),
    floor: Number.isFinite(Number(r.floor)) ? Number(r.floor) : null,
    buildYear: Number.isFinite(Number(r.buildyear)) ? Number(r.buildyear) : null
  }))
    .sort((a: RentHistoryItem, b: RentHistoryItem) => new Date(b.dealDate).getTime() - new Date(a.dealDate).getTime())
    .slice(0, 120);

  const activeTab = normalizeTab(tab);
  const trendWindow = normalizeTrendWindow(trend);
  const areaOptions = ["all", ...Array.from(new Set(trendDeals.map((d) => d.areaM2.toFixed(2)))).sort((a, b) => Number(a) - Number(b))].slice(0, 12);
  const selectedArea = areaOptions.includes(area ?? "") ? (area as string) : "all";
  const filteredTrendDeals = selectedArea === "all" ? trendDeals : trendDeals.filter((d) => d.areaM2.toFixed(2) === selectedArea);
  const saleTrend = computeSaleTrend(filteredTrendDeals, getTrendDays(trendWindow));
  const latestTrade = recentDeals[0] ?? null;
  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent3mCount = recentDeals.filter((d) => new Date(d.dealDate).getTime() >= threeMonthsAgo).length;
  const legalDongText = payload.umdNm ?? "";
  const regionNameText = payload.regionName || regionNameFromRows || payload.sggCd || sggCd;
  const summarySnippet = buildSummarySnippet(legalDongText, payload.complexName, latestTrade?.dealDate ?? null, latestTrade?.dealAmountManwon ?? null, recent3mCount);
  const trendComparisonText = trendWindow === "all"
    ? "전체 기간은 누적 지표만 제공합니다."
    : saleTrend.recentCount === 0
      ? "선택 조건에 해당하는 거래가 없습니다."
      : `직전 동일 기간 대비 거래량 ${saleTrend.countDiff >= 0 ? "+" : ""}${saleTrend.countDiff}건, 가격 ${saleTrend.avgDiff !== null ? `${saleTrend.avgDiff >= 0 ? "+" : "-"}${Math.abs(saleTrend.avgDiff).toLocaleString()}만원` : "-"} 변동.`;

  const buildHref = (next: Partial<{ tab: DetailTab; trend: TrendWindow; area: string; dealType: string }>) => {
    const q = new URLSearchParams();
    q.set("t", t);
    q.set("tab", next.tab ?? activeTab);
    q.set("trend", next.trend ?? trendWindow);
    q.set("area", next.area ?? selectedArea);
    if (next.dealType ?? dealType) q.set("dealType", next.dealType ?? dealType ?? "sale");
    return `/deallist/${encodeURIComponent(sggCd)}/${encodeURIComponent(ptypeCode)}/${encodeURIComponent(stableKey)}?${q.toString()}`;
  };

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 20px", display: "grid", gap: 16 }}>
      <Link href="/" style={{ color: "#0f766e", textDecoration: "underline", width: "fit-content" }}>
        뒤로
      </Link>

      <section className="complex-detail-hero" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{payload.complexName}</h1>
        <p style={{ color: "#475569", marginTop: 4 }}>{formatRegionText(regionNameText, legalDongText)}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <span className="ui-trust-chip">출처: 국토교통부 실거래가 공개데이터</span>
          <span className="ui-trust-chip">최종 업데이트: {formatKstDateTime(new Date().toISOString())}</span>
        </div>
        <p style={{ color: "#0f172a", marginTop: 10, lineHeight: 1.55 }}>{summarySnippet}</p>
      </section>

      <section
        className="complex-detail-tabs"
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
        {(["price", "listings", "info"] as DetailTab[]).map((k) => (
          <Link key={k} href={buildHref({ tab: k })} className="ui-button" style={{ background: activeTab === k ? "#0f766e" : "#f8fafc", color: activeTab === k ? "#fff" : "#0f172a" }}>
            {k === "price" ? "시세·실거래" : k === "listings" ? "매물" : "단지정보"}
          </Link>
        ))}
      </section>

      {activeTab === "price" && (
        <>
          <section className="complex-detail-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div className="complex-detail-kpi-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <p style={{ color: "#64748b" }}>최근 거래가</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{formatManwon(latestTrade?.dealAmountManwon)}</p>
            </div>
            <div className="complex-detail-kpi-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <p style={{ color: "#64748b" }}>최근 거래일</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{latestTrade ? new Date(latestTrade.dealDate).toLocaleDateString("ko-KR") : "-"}</p>
            </div>
            <div className="complex-detail-kpi-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <p style={{ color: "#64748b" }}>최근 3개월 거래</p>
              <p style={{ fontSize: 24, fontWeight: 800 }}>{recent3mCount}건</p>
            </div>
          </section>

          <TradeChartPanel deals={trendDeals} initialArea={selectedArea} complexName={payload.complexName} />

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
                    href={buildHref({ trend: w })}
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
                  href={buildHref({ area: a })}
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
              dealType={dealType === "jeonse" || dealType === "wolse" ? dealType : "sale"}
              trendWindow={trendWindow}
              selectedArea={selectedArea}
              saleTrend={saleTrend}
              trendComparisonText={trendComparisonText}
              recentDeals={recentDeals}
              recentRentDeals={recentRentDeals}
            />
          </section>

          <FinanceEstimateCard
            aptName={payload.complexName}
            defaultPriceManwon={latestTrade?.dealAmountManwon ?? null}
            noSnippet
          />
        </>
      )}

      {activeTab === "listings" && (
        <>
          <section style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
            <ComplexDealTypePanel
              dealType={dealType === "jeonse" || dealType === "wolse" ? dealType : "sale"}
              trendWindow={trendWindow}
              selectedArea={selectedArea}
              saleTrend={saleTrend}
              trendComparisonText={trendComparisonText}
              recentDeals={recentDeals}
              recentRentDeals={recentRentDeals}
            />
          </section>

          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>매물</h2>
            <p style={{ color: "#64748b" }}>현재 표시 가능한 매물이 없습니다.</p>
          </section>
        </>
      )}

      {activeTab === "info" && (
        <>
          <section style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 12, padding: 16, display: "grid", gap: 12 }}>
            <ComplexDealTypePanel
              dealType={dealType === "jeonse" || dealType === "wolse" ? dealType : "sale"}
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
            <p style={{ color: "#64748b", marginTop: 4 }}>최종 업데이트: {formatKstDateTime(new Date().toISOString())}</p>
          </section>

          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>생활 인프라 요약</h2>
            <p style={{ color: "#64748b" }}>{regionNameText} {legalDongText} 기준</p>
          </section>
        </>
      )}
    </main>
  );
}
