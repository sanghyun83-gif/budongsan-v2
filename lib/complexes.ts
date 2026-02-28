import { getDbPool, hasDatabaseUrl } from "@/lib/db";

export interface ComplexSummary {
  id: number;
  aptName: string;
  legalDong: string;
  regionCode: string;
  regionName: string;
  addressRoad: string | null;
  addressJibun: string | null;
  lat: number | null;
  lng: number | null;
  buildYear: number | null;
  totalUnits: number | null;
  latestDealAmount: number | null;
  latestDealDate: string | null;
  dealCount3m: number;
  updatedAt: string;
}

export interface DealHistoryItem {
  id: number;
  dealDate: string;
  dealAmountManwon: number;
  areaM2: number;
  floor: number | null;
  buildYear: number | null;
}

export async function getComplexSummaryById(id: number): Promise<ComplexSummary | null> {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured");
  }

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
      c.build_year,
      c.total_units,
      latest.deal_amount_manwon AS latest_deal_amount,
      latest.deal_date AS latest_deal_date,
      COALESCE(stats.deal_count_3m, 0) AS deal_count_3m,
      c.updated_at
    FROM complex c
    JOIN region r ON r.id = c.region_id
    LEFT JOIN LATERAL (
      SELECT d.deal_amount_manwon, d.deal_date
      FROM deal_trade_normalized d
      WHERE d.complex_id = c.id
      ORDER BY d.deal_date DESC
      LIMIT 1
    ) latest ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::INT AS deal_count_3m
      FROM deal_trade_normalized d
      WHERE d.complex_id = c.id
        AND d.deal_date >= (CURRENT_DATE - INTERVAL '3 months')
    ) stats ON true
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
    buildYear: row.build_year === null ? null : Number(row.build_year),
    totalUnits: row.total_units === null ? null : Number(row.total_units),
    latestDealAmount: row.latest_deal_amount === null ? null : Number(row.latest_deal_amount),
    latestDealDate: row.latest_deal_date ? new Date(row.latest_deal_date).toISOString() : null,
    dealCount3m: Number(row.deal_count_3m ?? 0),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export async function getComplexDealsById(id: number, page = 1, size = 20): Promise<DealHistoryItem[]> {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured");
  }

  const offset = (page - 1) * size;
  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT id, deal_date, deal_amount_manwon, area_m2, floor, build_year
    FROM deal_trade_normalized
    WHERE complex_id = $1
    ORDER BY deal_date DESC, id DESC
    LIMIT $2 OFFSET $3
    `,
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
