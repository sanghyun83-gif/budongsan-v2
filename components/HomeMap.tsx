"use client";

import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
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
  hoveredComplexId?: number | null;
  onBoundsChanged?: (bounds: Bounds) => void;
  onMarkerSelected?: (complex: MapComplex) => void;
  fitRequestKey?: number;
}

function getLocationQuality(complex: MapComplex): "exact" | "approx" {
  return complex.locationQuality ?? complex.locationSource ?? "approx";
}

export default function HomeMap({ complexes, hoveredComplexId, onBoundsChanged, onMarkerSelected, fitRequestKey }: HomeMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<InstanceType<typeof window.kakao.maps.Map> | null>(null);
  const markerEntriesRef = useRef<
    Array<{
      id: number;
      marker: {
        setMap: (map: unknown | null) => void;
      };
    }>
  >([]);
  const [error, setError] = useState("");
  const [zoomLevel, setZoomLevel] = useState(7);
  const complexesRef = useRef<MapComplex[]>(complexes);

  function readMapLevel(map: unknown): number {
    if (typeof map === "object" && map !== null && "getLevel" in map) {
      const value = (map as { getLevel: () => number }).getLevel();
      if (typeof value === "number" && Number.isFinite(value)) return value;
    }
    return 7;
  }

  useEffect(() => {
    complexesRef.current = complexes;
  }, [complexes]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await loadKakaoMapsSdk(KAKAO_KEY);
        if (cancelled || !containerRef.current) return;

        const center = new window.kakao.maps.LatLng(37.5665, 126.978);
        const map = new window.kakao.maps.Map(containerRef.current, { center, level: 7 });
        mapRef.current = map;
        setZoomLevel(readMapLevel(map));

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
        window.kakao.maps.event.addListener(map, "zoom_changed", () => {
          setZoomLevel(readMapLevel(map));
        });
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

    for (const entry of markerEntriesRef.current) {
      entry.marker.setMap(null);
    }
    markerEntriesRef.current = [];

    const markerCap = zoomLevel >= 8 ? 80 : zoomLevel >= 6 ? 140 : 240;
    for (const c of complexes.slice(0, markerCap)) {
      const locationQuality = getLocationQuality(c);
      const pos = new window.kakao.maps.LatLng(c.lat, c.lng);
      const marker = new window.kakao.maps.Marker({
        map,
        position: pos,
        title: `${c.aptName} (${locationQuality === "exact" ? "정확 좌표" : "근사 위치"})`
      });

      window.kakao.maps.event.addListener(marker, "click", () => {
        trackEvent("map_pin_click", {
          complex_id: c.id,
          apt_name: c.aptName,
          source: "home_map"
        });
        onMarkerSelected?.(c);
      });

      markerEntriesRef.current.push({ id: c.id, marker });
    }
  }, [complexes, onMarkerSelected, zoomLevel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const targets = complexesRef.current;
    if (!targets.length) return;

    if (targets.length === 1) {
      const only = targets[0];
      map.setLevel(4);
      map.panTo(new window.kakao.maps.LatLng(only.lat, only.lng));
      return;
    }

    const bounds = new window.kakao.maps.LatLngBounds();
    for (const c of targets.slice(0, 120)) {
      bounds.extend(new window.kakao.maps.LatLng(c.lat, c.lng));
    }
    map.setBounds(bounds);
  }, [fitRequestKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!hoveredComplexId) return;

    const target = complexesRef.current.find((item) => item.id === hoveredComplexId);
    if (!target) return;

    map.panTo(new window.kakao.maps.LatLng(target.lat, target.lng));
  }, [hoveredComplexId]);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>지도 탐색</h2>
      <div ref={containerRef} className="map-canvas" />
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
    </section>
  );
}
