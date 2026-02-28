"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMapsSdk } from "@/lib/map/kakao";
import type { MapComplex } from "@/lib/types";

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "";

type Bounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

interface HomeMapProps {
  complexes: MapComplex[];
  onBoundsChanged?: (bounds: Bounds) => void;
}

export default function HomeMap({ complexes, onBoundsChanged }: HomeMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<InstanceType<typeof window.kakao.maps.Map> | null>(null);
  const markersRef = useRef<Array<{ setMap: (map: unknown | null) => void }>>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await loadKakaoMapsSdk(KAKAO_KEY);
        if (cancelled || !containerRef.current) return;

        const center = new window.kakao.maps.LatLng(37.5665, 126.978);
        const map = new window.kakao.maps.Map(containerRef.current, { center, level: 7 });
        mapRef.current = map;

        const emitBounds = () => {
          if (!onBoundsChanged) return;
          const b = map.getBounds();
          const sw = b.getSouthWest();
          const ne = b.getNorthEast();
          onBoundsChanged({
            swLat: sw.getLat(),
            swLng: sw.getLng(),
            neLat: ne.getLat(),
            neLng: ne.getLng()
          });
        };

        emitBounds();
        window.kakao.maps.event.addListener(map, "idle", emitBounds);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown map error");
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [onBoundsChanged]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const marker of markersRef.current) {
      marker.setMap(null);
    }
    markersRef.current = [];

    for (const c of complexes.slice(0, 300)) {
      const pos = new window.kakao.maps.LatLng(c.lat, c.lng);
      const marker = new window.kakao.maps.Marker({ map, position: pos, title: `${c.aptName} ${c.dealAmount}` });
      markersRef.current.push(marker);
    }
  }, [complexes]);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>지도 탐색</h2>
      <div ref={containerRef} className="map-canvas" />
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
    </section>
  );
}
