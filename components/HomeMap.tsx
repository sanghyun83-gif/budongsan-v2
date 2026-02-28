"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMapsSdk } from "@/lib/map/kakao";
import type { MapComplex } from "@/lib/types";

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";

export default function HomeMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await loadKakaoMapsSdk(KAKAO_KEY);
        if (cancelled || !containerRef.current) return;

        const center = new window.kakao.maps.LatLng(37.5665, 126.9780);
        const map = new window.kakao.maps.Map(containerRef.current, { center, level: 7 });

        const res = await fetch("/api/map/complexes?sw_lat=37.0&sw_lng=126.4&ne_lat=37.8&ne_lng=127.5", { cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; complexes?: MapComplex[]; error?: string };

        if (!json.ok || !json.complexes) {
          throw new Error(json.error ?? "Failed to fetch complexes");
        }

        for (const c of json.complexes.slice(0, 120)) {
          const pos = new window.kakao.maps.LatLng(c.lat, c.lng);
          new window.kakao.maps.Marker({ map, position: pos, title: `${c.aptName} ${c.dealAmount}` });
        }

        setLoaded(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown map error");
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Map Preview (Kakao + MOLIT)</h2>
      <div
        ref={containerRef}
        style={{ width: "100%", height: 520, borderRadius: 16, border: "1px solid #e5e7eb", background: "#f8fafc" }}
      />
      {loaded && <p style={{ color: "#065f46" }}>Map loaded and markers rendered.</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
    </section>
  );
}

