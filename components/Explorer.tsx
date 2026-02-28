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

const DEFAULT_BOUNDS: Bounds = {
  swLat: 37.0,
  swLng: 126.4,
  neLat: 37.8,
  neLng: 127.5
};

function formatManwon(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${value.toLocaleString()}만원`;
}

export default function Explorer() {
  const router = useRouter();

  const [q, setQ] = useState("래미안");
  const [region, setRegion] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bounds, setBounds] = useState<Bounds>(DEFAULT_BOUNDS);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [mapItems, setMapItems] = useState<MapComplex[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(new Date().toISOString());
  const [initialized, setInitialized] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQ(sp.get("q") ?? "래미안");
    setRegion(sp.get("region") ?? "");
    setMinPrice(sp.get("min_price") ?? "");
    setMaxPrice(sp.get("max_price") ?? "");
    setInitialized(true);
  }, []);

  const queryState = useMemo(
    () => ({ q: q.trim(), region: region.trim(), minPrice: minPrice.trim(), maxPrice: maxPrice.trim(), bounds }),
    [q, region, minPrice, maxPrice, bounds]
  );

  const syncUrl = useCallback(() => {
    const sp = new URLSearchParams();
    if (queryState.q) sp.set("q", queryState.q);
    if (queryState.region) sp.set("region", queryState.region);
    if (queryState.minPrice) sp.set("min_price", queryState.minPrice);
    if (queryState.maxPrice) sp.set("max_price", queryState.maxPrice);
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
      return;
    }

    setLoading(true);
    setError("");

    try {
      const common = new URLSearchParams();
      common.set("q", queryState.q);
      common.set("page", "1");
      common.set("size", "20");
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
        throw new Error(searchJson.error ?? "검색 API 요청 실패");
      }
      if (!mapRes.ok || !mapJson.ok) {
        throw new Error(mapJson.error ?? "지도 API 요청 실패");
      }

      setSearchItems(searchJson.items ?? []);
      setMapItems(mapJson.complexes ?? []);
      setUpdatedAt(searchJson.updatedAt ?? new Date().toISOString());
      syncUrl();
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
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

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px", display: "grid", gap: 14 }}>
      <header>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>budongsan-v2</h1>
        <p style={{ color: "#475569" }}>검색 → 지도/리스트 동기화 → 단지 상세</p>
      </header>

      <form onSubmit={runSearch} className="explorer-filter-grid">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="단지명/동" className="ui-input" />
        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="지역코드(예:11680)" className="ui-input" />
        <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="최소가(만원)" className="ui-input" />
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="최대가(만원)" className="ui-input" />
        <button type="submit" className="ui-button" disabled={loading}>{loading ? "검색중..." : "검색"}</button>
      </form>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#475569", fontSize: 14 }}>
        <span>출처: 국토교통부 실거래가 공개데이터</span>
        <span>최종 업데이트: {new Date(updatedAt).toLocaleString("ko-KR")}</span>
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
            <div style={{ color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: 10, padding: 12 }}>
              조건에 맞는 단지가 없습니다.
            </div>
          )}
          {searchItems.map((item) => (
            <Link key={item.id} href={`/complexes/${item.id}`} className="ui-card-link">
              <div>
                <p style={{ fontWeight: 700 }}>{item.apt_name}</p>
                <p style={{ color: "#64748b", fontSize: 14 }}>{item.region_name} {item.legal_dong}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 700 }}>{formatManwon(item.deal_amount_manwon)}</p>
                <p style={{ color: "#64748b", fontSize: 13 }}>{item.deal_date ? new Date(item.deal_date).toLocaleDateString("ko-KR") : "-"}</p>
              </div>
            </Link>
          ))}
        </aside>
      </section>
    </main>
  );
}
