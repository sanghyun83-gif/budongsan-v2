import { NextRequest, NextResponse } from "next/server";
import type { MapComplex } from "@/lib/types";
import { DEFAULT_REGION_CODES } from "@/lib/regions";
import { getTopDeals } from "@/lib/api/molit";

function hashToOffset(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) % 10000;
  }
  return (h / 10000 - 0.5) * 0.08;
}

function regionCenter(code: string): { lat: number; lng: number } {
  if (code === "11680") return { lat: 37.5172, lng: 127.0473 };
  if (code === "11650") return { lat: 37.4837, lng: 127.0324 };
  if (code === "11710") return { lat: 37.5145, lng: 127.1066 };
  if (code === "41135") return { lat: 37.3826, lng: 127.1187 };
  if (code === "41465") return { lat: 37.3222, lng: 127.0977 };
  return { lat: 37.5665, lng: 126.978 };
}

export async function GET(req: NextRequest) {
  try {
    const swLat = Number(req.nextUrl.searchParams.get("sw_lat") ?? "-90");
    const swLng = Number(req.nextUrl.searchParams.get("sw_lng") ?? "-180");
    const neLat = Number(req.nextUrl.searchParams.get("ne_lat") ?? "90");
    const neLng = Number(req.nextUrl.searchParams.get("ne_lng") ?? "180");

    const regionDeals = await Promise.all(
      DEFAULT_REGION_CODES.map(async (code) => {
        const deals = await getTopDeals(code, 2, 50);
        const center = regionCenter(code);
        return deals.map((d) => {
          const lat = center.lat + hashToOffset(d.aptId + "lat");
          const lng = center.lng + hashToOffset(d.aptId + "lng");
          const out: MapComplex = {
            aptId: d.aptId,
            aptName: d.aptName,
            legalDong: d.legalDong,
            dealAmount: d.dealAmount,
            lat,
            lng
          };
          return out;
        });
      })
    );

    const all = regionDeals.flat();
    const dedup = new Map<string, MapComplex>();
    for (const item of all) {
      if (!dedup.has(item.aptId)) dedup.set(item.aptId, item);
    }

    const filtered = Array.from(dedup.values()).filter((c) =>
      c.lat >= swLat && c.lat <= neLat && c.lng >= swLng && c.lng <= neLng
    );

    return NextResponse.json({ ok: true, count: filtered.length, complexes: filtered.slice(0, 300) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

