"use client";

import { useEffect, useState } from "react";
import type { ComplexListingsResponse } from "@/lib/types";

interface ComplexListingsTabProps {
  complexId: number;
}

export default function ComplexListingsTab({ complexId }: ComplexListingsTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ComplexListingsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchListings = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/complexes/${complexId}/listings?page=1&size=20&dealType=all&propertyType=apartment&provider=placeholder`, {
          cache: "no-store"
        });
        const json = (await res.json()) as ComplexListingsResponse & { error?: string };
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "매물 API 요청 실패");
        }
        if (cancelled) return;
        setData(json);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "알 수 없는 오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchListings();

    return () => {
      cancelled = true;
    };
  }, [complexId]);

  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>매물</h2>

      {loading && <p style={{ color: "#64748b" }}>매물 정보를 불러오는 중...</p>}
      {error && !loading && <p style={{ color: "#b91c1c" }}>오류: {error}</p>}

      {!loading && !error && (data?.listings?.length ?? 0) === 0 && (
        <p style={{ color: "#64748b" }}>
          {data?.message ?? "현재 표시 가능한 매물이 없습니다."}
        </p>
      )}

      {!loading && !error && (data?.listings?.length ?? 0) > 0 && (
        <p style={{ color: "#64748b", fontSize: 12, marginTop: 10 }}>
          최근 업데이트: {data?.updatedAt ?? "-"}
        </p>
      )}
    </section>
  );
}
