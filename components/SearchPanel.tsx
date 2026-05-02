"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type MarketTabKey = "apt_sale" | "villa_sale";

type AptSearchItem = {
  id: string;
  apt_name: string;
  legal_dong: string;
  region_name: string;
  deal_amount_manwon: number | null;
  deal_date: string | null;
};

type VillaSearchItem = {
  rowhouseId: number | null;
  aptName: string;
  legalDong: string;
  sggCd: string;
  dealAmountManwon: number | null;
  dealDate: string | null;
};

const MARKET_TABS: Array<{ key: MarketTabKey; label: string }> = [
  { key: "apt_sale", label: "아파트 매매" },
  { key: "villa_sale", label: "빌라 매매" }
];

function parseMarketTab(value: string | null): MarketTabKey {
  return value === "villa_sale" ? "villa_sale" : "apt_sale";
}

function formatManwon(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${value.toLocaleString()}만원`;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

export default function SearchPanel() {
  const router = useRouter();
  const pathname = usePathname();

  const [marketTab, setMarketTab] = useState<MarketTabKey>("apt_sale");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Array<AptSearchItem | VillaSearchItem>>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { items: Array<AptSearchItem | VillaSearchItem>; totalCount: number }>>(new Map());

  const trimmedQ = q.trim();
  const hasItems = useMemo(() => items.length > 0, [items]);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setMarketTab(parseMarketTab(params.get("market")));
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  function handleMarketTabChange(nextTab: MarketTabKey) {
    setMarketTab(nextTab);
    const next = new URLSearchParams(window.location.search);
    if (nextTab === "villa_sale") next.set("market", "villa_sale");
    else next.delete("market");
    const nextQuery = next.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (!trimmedQ) {
      setItems([]);
      setTotalCount(0);
      setError("");
      return;
    }

    const cacheKey = `${marketTab}:${trimmedQ}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setItems(cached.items);
      setTotalCount(cached.totalCount);
      setError("");
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError("");

      try {
        const sp = new URLSearchParams();
        sp.set("q", trimmedQ);
        sp.set("page", "1");
        sp.set("size", "20");

        const endpoint = marketTab === "villa_sale" ? "/api/rowhouses/search" : "/api/search";
        if (marketTab === "apt_sale") {
          sp.set("sort", "latest");
          sp.set("lite", "true");
        }

        const res = await fetch(`${endpoint}?${sp.toString()}`, {
          cache: "no-store",
          signal: controller.signal
        });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "검색 요청 실패");
        }

        const nextItems = (json.items ?? []) as Array<AptSearchItem | VillaSearchItem>;
        const nextTotalCount = Number(json.totalCount ?? json.total ?? json.count ?? 0);
        cacheRef.current.set(cacheKey, { items: nextItems, totalCount: nextTotalCount });
        setItems(nextItems);
        setTotalCount(nextTotalCount);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setItems([]);
        setTotalCount(0);
        setError(e instanceof Error ? e.message : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [trimmedQ, marketTab]);

  return (
    <main className="search-home-wrap">
      <div className="search-home-layout">
        <aside className="search-left-nav">
          <div className="search-left-brand">살집</div>
          {MARKET_TABS.map((tab) => {
            const active = marketTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleMarketTabChange(tab.key)}
                className={`search-left-nav-item ${active ? "is-active" : ""}`}
              >
                {tab.label}
              </button>
            );
          })}
        </aside>

        <section className="search-main-pane">
          <div className="search-input-card">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={marketTab === "villa_sale" ? "빌라명, 지역명 검색" : "아파트명, 지역명 검색"}
              className="search-main-input"
            />
            <p className="search-meta-text">
              {trimmedQ ? `검색결과 ${totalCount.toLocaleString()}건` : "검색어를 입력하면 단지 목록이 나타납니다."}
            </p>
          </div>

          {error && <div className="search-error-box">오류: {error}</div>}
          {loading && <div className="search-loading-text">검색 중...</div>}

          {!loading && trimmedQ && !error && !hasItems && (
            <div className="search-empty-box">일치하는 단지가 없습니다.</div>
          )}

          {hasItems && (
            <div className="search-result-list">
              {items.map((item, idx) => {
                if (marketTab === "villa_sale") {
                  const v = item as VillaSearchItem;
                  const href = v.rowhouseId ? `/rowhouses/${v.rowhouseId}` : "#";
                  return (
                    <Link key={`${v.sggCd}-${v.aptName}-${v.legalDong}-${idx}`} href={href} className="search-result-item">
                      <div style={{ display: "grid", gap: 4 }}>
                        <p style={{ fontWeight: 800, color: "#0f172a" }}>{v.aptName}</p>
                        <p style={{ color: "#64748b", fontSize: 13 }}>{v.sggCd} {v.legalDong}</p>
                      </div>
                      <div style={{ textAlign: "right", display: "grid", alignContent: "center", gap: 2 }}>
                        <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{formatManwon(v.dealAmountManwon)}</p>
                        <p style={{ color: "#94a3b8", fontSize: 12 }}>{formatDate(v.dealDate)}</p>
                      </div>
                    </Link>
                  );
                }

                const a = item as AptSearchItem;
                return (
                  <Link key={a.id} href={`/complexes/${a.id}`} className="search-result-item">
                    <div style={{ display: "grid", gap: 4 }}>
                      <p style={{ fontWeight: 800, color: "#0f172a" }}>{a.apt_name}</p>
                      <p style={{ color: "#64748b", fontSize: 13 }}>{a.region_name} {a.legal_dong}</p>
                    </div>
                    <div style={{ textAlign: "right", display: "grid", alignContent: "center", gap: 2 }}>
                      <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{formatManwon(a.deal_amount_manwon)}</p>
                      <p style={{ color: "#94a3b8", fontSize: 12 }}>{formatDate(a.deal_date)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
