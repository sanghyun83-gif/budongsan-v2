import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import type { LocationQuality } from "@/lib/types";
import type { DealHistoryItem, RentHistoryItem, TrendDealItem } from "@/lib/complexes";

export type { DealHistoryItem, RentHistoryItem, TrendDealItem };

export interface RowhouseSummary {
  id: number;
  aptName: string;
  legalDong: string;
  regionCode: string;
  regionName: string;
  addressRoad: string | null;
  addressJibun: string | null;
  lat: number | null;
  lng: number | null;
  locationQuality: LocationQuality;
  locationSource?: LocationQuality;
  buildYear: number | null;
  totalUnits: number | null;
  latestDealAmount: number | null;
  latestDealDate: string | null;
  dealCount3m: number;
  updatedAt: string;
}

type BaseProfile = Omit<RowhouseSummary, "latestDealAmount" | "latestDealDate" | "dealCount3m">;

function parseNum(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  const n = Number(String(input).replaceAll(",", "").trim());
  return Number.isFinite(n) ? n : null;
}

function toIsoDate(year?: string, month?: string, day?: string): string | null {
  if (!year || !month || !day) return null;
  const mm = month.padStart(2, "0");
  const dd = day.padStart(2, "0");
  const d = new Date(`${year}-${mm}-${dd}T00:00:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function fetchJson(path: string, params: Record<string, string | number | undefined>) {
  const apiKey = process.env.SOOTJA_API_KEY ?? process.env.API_KEY;
  const base = process.env.SOOTJA_API_BASE_URL ?? "https://sootja.kr/api";
  if (!apiKey) throw new Error("SOOTJA_API_KEY is not configured");

  const sp = new URLSearchParams();
  sp.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).length > 0) sp.set(k, String(v));
  }

  const res = await fetch(`${base}${path}?${sp.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`SOOTJA_API_ERROR ${res.status}`);
  return res.json();
}

async function getBaseProfileById(id: number): Promise<BaseProfile | null> {
  if (!hasDatabaseUrl()) throw new Error("DATABASE_URL is not configured");
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      c.id,
      c.apt_name,
      c.legal_dong,
      r.code AS region_code,
      r.name_ko AS region_name,
      c.address_road,
      c.address_jibun,
      ST_Y(c.location::geometry) AS lat,
      ST_X(c.location::geometry) AS lng,
      c.location_source,
      c.build_year,
      c.total_units,
      c.updated_at
    FROM complex c
    JOIN region r ON r.id = c.region_id
    WHERE c.id = $1
    LIMIT 1
    `,
    [id]
  );
  if (result.rowCount === 0) return null;
  const row = result.rows[0];
  return {
    id: Number(row.id),
    aptName: row.apt_name,
    legalDong: row.legal_dong ?? "",
    regionCode: row.region_code,
    regionName: row.region_name,
    addressRoad: row.address_road ?? null,
    addressJibun: row.address_jibun ?? null,
    lat: row.lat === null ? null : Number(row.lat),
    lng: row.lng === null ? null : Number(row.lng),
    locationQuality: row.location_source === "exact" ? "exact" : "approx",
    locationSource: row.location_source === "exact" ? "exact" : "approx",
    buildYear: row.build_year === null ? null : Number(row.build_year),
    totalUnits: row.total_units === null ? null : Number(row.total_units),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

async function getDbDealsById(id: number, page = 1, size = 20): Promise<DealHistoryItem[]> {
  const offset = (page - 1) * size;
  const pool = getDbPool();
  const result = await pool.query(
    `SELECT id, deal_date, deal_amount_manwon, area_m2, floor, build_year
     FROM deal_rowhouse_trade_normalized
     WHERE complex_id = $1
     ORDER BY deal_date DESC, id DESC
     LIMIT $2 OFFSET $3`,
    [id, size, offset]
  );
  return result.rows.map((row) => ({
    id: Number(row.id),
    dealDate: new Date(row.deal_date).toISOString(),
    dealAmountManwon: Number(row.deal_amount_manwon),
    areaM2: Number(row.area_m2),
    floor: row.floor === null ? null : Number(row.floor),
    buildYear: row.build_year === null ? null : Number(row.build_year)
  }));
}

export async function getRowhouseSummaryById(id: number): Promise<RowhouseSummary | null> {
  const base = await getBaseProfileById(id);
  if (!base) return null;

  try {
    const latest = await fetchJson("/v1/dasaedae/trade", {
      sggCd: base.regionCode,
      mhouseNm: base.aptName,
      umdNm: base.legalDong,
      sort: "deal_ymd:desc",
      page: 1,
      page_size: 1
    });

    const now = new Date();
    const to = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const from = `${fromDate.getFullYear()}${String(fromDate.getMonth() + 1).padStart(2, "0")}`;

    const count3m = await fetchJson("/v1/dasaedae/trade", {
      sggCd: base.regionCode,
      mhouseNm: base.aptName,
      umdNm: base.legalDong,
      deal_ymd_from: from,
      deal_ymd_to: to,
      page: 1,
      page_size: 1
    });

    const item = latest?.items?.[0];
    return {
      ...base,
      latestDealAmount: parseNum(item?.dealamount),
      latestDealDate: toIsoDate(item?.dealyear, item?.dealmonth, item?.dealday),
      dealCount3m: Number(count3m?.total ?? 0)
    };
  } catch {
    return { ...base, latestDealAmount: null, latestDealDate: null, dealCount3m: 0 };
  }
}

export async function getRowhouseDealsById(id: number, page = 1, size = 20): Promise<DealHistoryItem[]> {
  const base = await getBaseProfileById(id);
  if (!base) return [];

  try {
    const json = await fetchJson("/v1/dasaedae/trade", {
      sggCd: base.regionCode,
      mhouseNm: base.aptName,
      umdNm: base.legalDong,
      sort: "deal_ymd:desc",
      page,
      page_size: size
    });
    return (json?.items ?? []).map((row: Record<string, string>) => ({
      id: Number(`${row.dealyear ?? ""}${row.dealmonth ?? ""}${row.dealday ?? ""}${row.jibun ?? "0"}`.replace(/\D/g, "").slice(0, 15) || Date.now()),
      dealDate: toIsoDate(row.dealyear, row.dealmonth, row.dealday) ?? new Date().toISOString(),
      dealAmountManwon: parseNum(row.dealamount) ?? 0,
      areaM2: parseNum(row.excluusear) ?? 0,
      floor: parseNum(row.floor),
      buildYear: parseNum(row.buildyear)
    }));
  } catch {
    return getDbDealsById(id, page, size);
  }
}

export async function getRowhouseTrendDealsById(id: number, size = 300): Promise<TrendDealItem[]> {
  const deals = await getRowhouseDealsById(id, 1, Math.min(size, 300));
  return deals.map((d) => ({ dealDate: d.dealDate, dealAmountManwon: d.dealAmountManwon, areaM2: d.areaM2 }));
}

export async function getRowhouseRentDealsById(id: number, size = 200): Promise<RentHistoryItem[]> {
  void id;
  void size;
  return [];
}
