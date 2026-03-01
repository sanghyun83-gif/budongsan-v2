"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomeMap from "@/components/HomeMap";
import type { MapComplex } from "@/lib/types";

type SearchItem = {
  id: string;
  apt_name: string;
  legal_dong: string;
  region_code: string;
  region_name: string;
  lat: number | null;
  lng: number | null;
  deal_amount_manwon: number | null;
  deal_date: string | null;
};

type Bounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

type SortValue = "latest" | "price_desc" | "price_asc" | "deal_count";

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "latest", label: "최신 거래순" },
  { value: "price_desc", label: "가격 높은순" },
  { value: "price_asc", label: "가격 낮은순" },
  { value: "deal_count", label: "최근 3개월 거래량순" }
];

const DEFAULT_BOUNDS: Bounds = {
  swLat: 37.0,
  swLng: 126.4,
  neLat: 37.8,
  neLng: 127.5
};

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

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function formatManwon(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만`;
  if (uk > 0) return `${uk}억`;
  return `${value.toLocaleString()}만`;
}

function formatKstDateTime(input: string | null): string {
  if (!input) return "-";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "-";
  return KST_DATE_TIME_FORMATTER.format(parsed);
}

function formatKstDate(input: string | null): string {
  if (!input) return "-";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "-";
  return KST_DATE_FORMATTER.format(parsed);
}

export default function Explorer() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortValue>("latest");
  const [bounds, setBounds] = useState<Bounds>(DEFAULT_BOUNDS);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [mapItems, setMapItems] = useState<MapComplex[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQ(sp.get("q") ?? "");
    setRegion(sp.get("region") ?? "");
    setMinPrice(sp.get("min_price") ?? "");
    setMaxPrice(sp.get("max_price") ?? "");

    const candidateSort = sp.get("sort");
    if (candidateSort && SORT_OPTIONS.some((s) => s.value === candidateSort)) {
      setSort(candidateSort as SortValue);
    }

    const swLat = Number(sp.get("sw_lat"));
    const swLng = Number(sp.get("sw_lng"));
    const neLat = Number(sp.get("ne_lat"));
    const neLng = Number(sp.get("ne_lng"));

    if (![swLat, swLng, neLat, neLng].some((v) => Number.isNaN(v))) {
      setBounds({ swLat, swLng, neLat, neLng });
    }

    setInitialized(true);
  }, []);

  const queryState = useMemo(
    () => ({
      q: q.trim(),
      region: region.trim(),
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
      sort,
      bounds
    }),
    [q, region, minPrice, maxPrice, sort, bounds]
  );

  const syncUrl = useCallback(() => {
    const sp = new URLSearchParams();
    if (queryState.q) sp.set("q", queryState.q);
    if (queryState.region) sp.set("region", queryState.region);
    if (queryState.minPrice) sp.set("min_price", queryState.minPrice);
    if (queryState.maxPrice) sp.set("max_price", queryState.maxPrice);
    sp.set("sort", queryState.sort);
    sp.set("sw_lat", String(queryState.bounds.swLat));
    sp.set("sw_lng", String(queryState.bounds.swLng));
    sp.set("ne_lat", String(queryState.bounds.neLat));
    sp.set("ne_lng", String(queryState.bounds.neLng));
    router.replace(`/?${sp.toString()}`, { scroll: false });
  }, [queryState, router]);

  const fetchAll = useCallback(async () => {
    if (!queryState.q) {
      setSearchItems([]);
      setMapItems([]);
      setUpdatedAt(null);
      syncUrl();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const common = new URLSearchParams();
      common.set("q", queryState.q);
      common.set("page", "1");
      common.set("size", "20");
      common.set("sort", queryState.sort);
      common.set("sw_lat", String(queryState.bounds.swLat));
      common.set("sw_lng", String(queryState.bounds.swLng));
      common.set("ne_lat", String(queryState.bounds.neLat));
      common.set("ne_lng", String(queryState.bounds.neLng));
      if (queryState.region) common.set("region", queryState.region);
      if (queryState.minPrice) common.set("min_price", queryState.minPrice);
      if (queryState.maxPrice) common.set("max_price", queryState.maxPrice);

      const mapQuery = new URLSearchParams(common);
      mapQuery.set("limit", "300");

      const [searchRes, mapRes] = await Promise.all([
        fetch(`/api/search?${common.toString()}`, { cache: "no-store" }),
        fetch(`/api/map/complexes?${mapQuery.toString()}`, { cache: "no-store" })
      ]);

      const searchJson = await searchRes.json();
      const mapJson = await mapRes.json();

      if (!searchRes.ok || !searchJson.ok) {
        throw new Error(searchJson.error ?? "Search API failed");
      }
      if (!mapRes.ok || !mapJson.ok) {
        throw new Error(mapJson.error ?? "Map API failed");
      }

      setSearchItems(searchJson.items ?? []);
      setMapItems(mapJson.complexes ?? []);
      setUpdatedAt(searchJson.updatedAt ?? null);
      syncUrl();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setSearchItems([]);
      setMapItems([]);
    } finally {
      setLoading(false);
    }
  }, [queryState, syncUrl]);

  const onMapBoundsChanged = useCallback((next: Bounds) => {
    setBounds(next);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchAll();
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [initialized, queryState.bounds, fetchAll]);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchAll();
  };

  const quickRegion = (nextRegion: string) => {
    setRegion(nextRegion);
    if (!q.trim()) setQ("래미안");
  };

  const resetFilters = () => {
    setQ("");
    setRegion("");
    setMinPrice("");
    setMaxPrice("");
    setSort("latest");
    setSearchItems([]);
    setMapItems([]);
    setUpdatedAt(null);
    router.replace("/", { scroll: false });
  };

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px", display: "grid", gap: 14 }}>
      <header>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>budongsan-v2</h1>
        <p style={{ color: "#475569" }}>검색 → 지도/리스트 동기화 → 단지 상세</p>
      </header>

      <form onSubmit={runSearch} className="explorer-filter-grid">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색어(예: 래미안)" className="ui-input" />
        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="지역코드(예:11680)" className="ui-input" />
        <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="최소가(만원)" className="ui-input" />
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="최대가(만원)" className="ui-input" />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortValue)} className="ui-input" aria-label="정렬">
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" className="ui-button" disabled={loading}>
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#475569", fontSize: 14 }}>
        <span>출처: 국토교통부 실거래가 공개데이터</span>
        <span>최종 업데이트: {formatKstDateTime(updatedAt)}</span>
        <span>리스트 {searchItems.length}건 · 지도 {mapItems.length}건</span>
      </div>

      {error && <div className="ui-error">오류: {error}</div>}

      <section className="explorer-grid">
        <div>
          <HomeMap complexes={mapItems} onBoundsChanged={onMapBoundsChanged} />
        </div>
        <aside style={{ display: "grid", gap: 8, alignContent: "start" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>검색 결과</h2>
          {!loading && !error && searchItems.length === 0 && (
            <div
              style={{
                color: "#64748b",
                border: "1px dashed #cbd5e1",
                borderRadius: 10,
                padding: 12,
                display: "grid",
                gap: 10
              }}
            >
              <span>조건에 맞는 단지가 없습니다.</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="ui-button" onClick={() => quickRegion("11680")}>
                  강남구 빠른 적용
                </button>
                <button type="button" className="ui-button" onClick={() => quickRegion("11710")}>
                  송파구 빠른 적용
                </button>
                <button type="button" className="ui-button" onClick={resetFilters}>
                  조건 초기화
                </button>
              </div>
            </div>
          )}
          {searchItems.map((item) => (
            <Link key={item.id} href={`/complexes/${item.id}`} className="ui-card-link">
              <div>
                <p style={{ fontWeight: 700 }}>{item.apt_name}</p>
                <p style={{ color: "#64748b", fontSize: 14 }}>
                  {item.region_name} {item.legal_dong}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 700 }}>{formatManwon(item.deal_amount_manwon)}</p>
                <p style={{ color: "#64748b", fontSize: 13 }}>{formatKstDate(item.deal_date)}</p>
              </div>
            </Link>
          ))}
        </aside>
      </section>
    </main>
  );
}