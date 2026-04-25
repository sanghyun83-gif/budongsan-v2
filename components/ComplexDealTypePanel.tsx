"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DealHistoryItem, RentHistoryItem } from "@/lib/complexes";

type DealTypeLabel = "매매" | "전세" | "월세";
type DealTypeParam = "sale" | "jeonse" | "wolse";

interface Props {
  dealType: DealTypeParam;
  trendWindow: "3m" | "6m" | "1y" | "all";
  selectedArea: string;
  saleTrend: {
    recentCount: number;
    recentAvg: number | null;
    avgDiffPct: number | null;
  };
  trendComparisonText: string;
  recentDeals: DealHistoryItem[];
  recentRentDeals: RentHistoryItem[];
}

interface SaleDealItem {
  id: number;
  dealDate: string;
  areaM2: number;
  floor: number | null;
  saleAmountManwon: number;
}

function formatManwon(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${value.toLocaleString()}만원`;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getTrendDays(windowKey: "3m" | "6m" | "1y" | "all"): number | null {
  if (windowKey === "3m") return 90;
  if (windowKey === "6m") return 180;
  if (windowKey === "1y") return 365;
  return null;
}

function isInWindow(dealDate: string, trendDays: number | null): boolean {
  const ts = new Date(dealDate).getTime();
  if (!Number.isFinite(ts)) return false;
  if (trendDays === null) return true;
  const now = Date.now();
  return ts >= now - trendDays * 24 * 60 * 60 * 1000;
}

function isInArea(areaM2: number, selectedArea: string): boolean {
  if (selectedArea === "all") return true;
  return areaM2.toFixed(2) === selectedArea;
}

export default function ComplexDealTypePanel({ dealType, trendWindow, selectedArea, saleTrend, trendComparisonText, recentDeals, recentRentDeals }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentDealTypeParam: DealTypeParam = useMemo(() => {
    const raw = searchParams.get("dealType");
    if (raw === "jeonse" || raw === "wolse") return raw;
    return dealType;
  }, [searchParams, dealType]);

  const currentDealType: DealTypeLabel = currentDealTypeParam === "sale" ? "매매" : currentDealTypeParam === "jeonse" ? "전세" : "월세";

  const setDealType = (next: DealTypeParam) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (next === "sale") sp.delete("dealType");
    else sp.set("dealType", next);
    const query = sp.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };

  const trendDays = getTrendDays(trendWindow);

  const saleDeals = useMemo(() => {
    return recentDeals
      .filter((d) => isInWindow(d.dealDate, trendDays) && isInArea(d.areaM2, selectedArea))
      .map<SaleDealItem>((d) => ({
        id: d.id,
        dealDate: d.dealDate,
        areaM2: d.areaM2,
        floor: d.floor,
        saleAmountManwon: d.dealAmountManwon
      }));
  }, [recentDeals, trendDays, selectedArea]);

  const jeonseDeals = useMemo(
    () => recentRentDeals.filter((d) => d.rentType === "jeonse" && isInWindow(d.dealDate, trendDays) && isInArea(d.areaM2, selectedArea)),
    [recentRentDeals, trendDays, selectedArea]
  );
  const wolseDeals = useMemo(
    () => recentRentDeals.filter((d) => d.rentType === "wolse" && isInWindow(d.dealDate, trendDays) && isInArea(d.areaM2, selectedArea)),
    [recentRentDeals, trendDays, selectedArea]
  );

  const activeDeals = currentDealType === "매매" ? saleDeals : currentDealType === "전세" ? jeonseDeals : wolseDeals;

  const windowText = trendWindow === "all" ? "전체 기간" : trendWindow === "1y" ? "최근 1년" : trendWindow === "6m" ? "최근 6개월" : "최근 3개월";

  const saleAvg = saleTrend.recentAvg;
  const jeonseAvg = average(jeonseDeals.map((d) => d.depositManwon));
  const wolseDepositAvg = average(wolseDeals.map((d) => d.depositManwon));
  const wolseMonthlyAvg = average(wolseDeals.map((d) => d.monthlyRentManwon));

  const maxPrimary = currentDealType === "매매"
    ? Math.max(...saleDeals.map((d) => d.saleAmountManwon), 0)
    : Math.max(...activeDeals.map((d) => d.depositManwon), 0);

  const minPrimaryRaw = currentDealType === "매매"
    ? Math.min(...saleDeals.map((d) => d.saleAmountManwon), Number.MAX_SAFE_INTEGER)
    : Math.min(...activeDeals.map((d) => d.depositManwon), Number.MAX_SAFE_INTEGER);
  const minPrimary = Number.isFinite(minPrimaryRaw) && minPrimaryRaw !== Number.MAX_SAFE_INTEGER ? minPrimaryRaw : null;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="deal-type-toggles">
        <button type="button" className={`toggle-btn ${currentDealType === "매매" ? "active" : ""}`} data-type="매매" onClick={() => setDealType("sale")}>
          매매
        </button>
        <button type="button" className={`toggle-btn ${currentDealType === "전세" ? "active" : ""}`} data-type="전세" onClick={() => setDealType("jeonse")}>
          전세
        </button>
        <button type="button" className={`toggle-btn ${currentDealType === "월세" ? "active" : ""}`} data-type="월세" onClick={() => setDealType("wolse")}>
          월세
        </button>
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12 }}>
        <p style={{ fontWeight: 700, color: "#0f766e", marginBottom: 4 }}>{currentDealType} 시세 동향</p>
        {currentDealType === "매매" && (
          <>
            <p style={{ color: "#0f172a" }}>
              {windowText} 기준 거래량은 <b>{saleTrend.recentCount}건</b>, 평균 거래가는 <b>{formatManwon(saleAvg)}</b>입니다.
            </p>
            <p style={{ color: "#475569", marginTop: 4 }}>{trendComparisonText}</p>
          </>
        )}
        {currentDealType === "전세" && (
          <p style={{ color: "#0f172a" }}>
            {windowText} 기준 전세 평균 보증금은 <b>{formatManwon(jeonseAvg)}</b>입니다.
          </p>
        )}
        {currentDealType === "월세" && (
          <p style={{ color: "#0f172a" }}>
            {windowText} 기준 월세 평균은 <b>보증금 {formatManwon(wolseDepositAvg)}</b> / <b>월세 {formatManwon(wolseMonthlyAvg)}</b>입니다.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12 }}>
          <p style={{ color: "#64748b" }}>역대 최고 {currentDealType === "매매" ? "매매" : "보증금"}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{formatManwon(maxPrimary)}</p>
        </div>
        <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12 }}>
          <p style={{ color: "#64748b" }}>역대 최저 {currentDealType === "매매" ? "매매" : "보증금"}</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{formatManwon(minPrimary)}</p>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{currentDealType} 최근 거래 내역</h3>
        {activeDeals.length === 0 ? (
          <p style={{ color: "#64748b" }}>거래 내역이 없습니다.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {activeDeals.map((d) => (
              <div
                key={`${currentDealType}-${d.id}`}
                style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}
              >
                <div>
                  <p style={{ fontWeight: 600 }}>{new Date(d.dealDate).toLocaleDateString("ko-KR")}</p>
                  <p style={{ color: "#64748b" }}>
                    {d.areaM2}m² · {d.floor ?? "-"}층
                  </p>
                </div>
                <p style={{ fontWeight: 700, textAlign: "right" }}>
                  {currentDealType === "매매" && formatManwon((d as SaleDealItem).saleAmountManwon)}
                  {currentDealType === "전세" && formatManwon((d as RentHistoryItem).depositManwon)}
                  {currentDealType === "월세" && `보증금 ${formatManwon((d as RentHistoryItem).depositManwon)} / 월세 ${formatManwon((d as RentHistoryItem).monthlyRentManwon)}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
