"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

export default function SearchResultsPage({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { items: SearchItem[]; totalCount: number }>>(new Map());

  const trimmedQ = q.trim();
  const hasItems = useMemo(() => items.length > 0, [items]);

  useEffect(() => {
    setQ(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!trimmedQ) {
      setItems([]);
      setTotalCount(0);
      setError("");
      setLoading(false);
      return;
    }

    const cached = cacheRef.current.get(trimmedQ);
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
        sp.set("size", "24");
        sp.set("sort", "latest");
        sp.set("lite", "true");

        const res = await fetch(`/api/search?${sp.toString()}`, { cache: "no-store", signal: controller.signal });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "검색 요청 실패");
        }

        const nextItems = (json.items ?? []) as SearchItem[];
        const nextTotalCount = Number(json.totalCount ?? json.count ?? 0);
        cacheRef.current.set(trimmedQ, { items: nextItems, totalCount: nextTotalCount });
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
  }, [trimmedQ]);

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "20px 16px", display: "grid", gap: 10 }}>
      {trimmedQ ? (
        <section style={{ border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", padding: 12 }}>
          <p style={{ color: "#334155", fontSize: 13, fontWeight: 700 }}>검색어: {trimmedQ}</p>
          <p style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>검색결과 {totalCount.toLocaleString()}건</p>
        </section>
      ) : null}

      {error && <div style={{ color: "#b91c1c", border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 10, padding: 10 }}>오류: {error}</div>}
      {loading && <div style={{ color: "#475569", fontSize: 14 }}>검색 중...</div>}

      {!loading && trimmedQ && !error && !hasItems && (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, background: "#fff", padding: 12, color: "#64748b" }}>
          일치하는 단지가 없습니다.
        </div>
      )}

      {hasItems && (
        <section style={{ display: "grid", gap: 8 }}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/complexes/${item.id}`}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                background: "#fff",
                padding: 12,
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 10,
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <p style={{ fontWeight: 800, color: "#0f172a" }}>{item.apt_name}</p>
                <p style={{ color: "#64748b", fontSize: 13 }}>{item.region_name} {item.legal_dong}</p>
              </div>
              <div style={{ textAlign: "right", display: "grid", alignContent: "center", gap: 2 }}>
                <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{formatManwon(item.deal_amount_manwon)}</p>
                <p style={{ color: "#94a3b8", fontSize: 12 }}>{formatDate(item.deal_date)}</p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
