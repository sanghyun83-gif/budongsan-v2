"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type SearchItem = {
  id: string;
  apt_name: string;
  legal_dong: string;
  region_name: string;
  deal_amount_manwon: number | null;
  deal_date: string | null;
};

function formatManwon(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${value.toLocaleString()}만원`;
}

export default function SearchPanel() {
  const [q, setQ] = useState("래미안");
  const [region, setRegion] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>(new Date().toISOString());

  const hasItems = useMemo(() => items.length > 0, [items]);

  async function runSearch(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const sp = new URLSearchParams();
      sp.set("q", q.trim());
      sp.set("page", "1");
      sp.set("size", "20");
      if (region.trim()) sp.set("region", region.trim());
      if (minPrice.trim()) sp.set("min_price", minPrice.trim());
      if (maxPrice.trim()) sp.set("max_price", maxPrice.trim());

      const res = await fetch(`/api/search?${sp.toString()}`, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "검색 요청 실패");
      }

      setItems(json.items ?? []);
      setUpdatedAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>검색</h2>
      <form onSubmit={runSearch} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="단지명/동" style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: 10 }} />
        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="지역코드(예:11680)" style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: 10 }} />
        <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="최소가(만원)" style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: 10 }} />
        <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="최대가(만원)" style={{ border: "1px solid #cbd5e1", borderRadius: 10, padding: 10 }} />
        <button type="submit" style={{ border: 0, borderRadius: 10, padding: "10px 14px", background: "#0f766e", color: "#fff", fontWeight: 700 }} disabled={loading}>
          {loading ? "검색중..." : "검색"}
        </button>
      </form>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#475569", fontSize: 14 }}>
        <span>데이터 출처: 국토교통부 실거래가</span>
        <span>최종 업데이트: {new Date(updatedAt).toLocaleString("ko-KR")}</span>
        <span>결과: {items.length}건</span>
      </div>

      {error && <div style={{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 10 }}>오류: {error}</div>}

      {!loading && !error && !hasItems && <div style={{ color: "#64748b" }}>조건에 맞는 단지가 없습니다.</div>}

      {hasItems && (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/complexes/${item.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: 12,
                textDecoration: "none",
                color: "inherit"
              }}
            >
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
        </div>
      )}
    </section>
  );
}
