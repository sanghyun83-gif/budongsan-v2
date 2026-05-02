import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";
import { buildSearchMatcher } from "@/lib/search/matcher";

const sortSchema = z.enum(["latest", "price_desc", "price_asc", "deal_count"]);
const MAX_DB_INT = 2_147_483_647;

const querySchema = z.object({
  q: z.string().trim().min(1).max(80),
  region: z.string().regex(/^\d{5}$/).optional(),
  min_price: z.coerce.number().int().min(0).max(MAX_DB_INT).optional(),
  max_price: z.coerce.number().int().min(0).max(MAX_DB_INT).optional(),
  max_age_years: z.coerce.number().int().min(0).max(100).optional(),
  min_total_units: z.coerce.number().int().min(0).max(MAX_DB_INT).optional(),
  max_total_units: z.coerce.number().int().min(0).max(MAX_DB_INT).optional(),
  sw_lat: z.coerce.number().min(-90).max(90).optional(),
  sw_lng: z.coerce.number().min(-180).max(180).optional(),
  ne_lat: z.coerce.number().min(-90).max(90).optional(),
  ne_lng: z.coerce.number().min(-180).max(180).optional(),
  sort: sortSchema.default("latest"),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20)
})
.refine(
  (input) => {
    if (input.min_price === undefined || input.max_price === undefined) return true;
    return input.min_price <= input.max_price;
  },
  { message: "min_price must be less than or equal to max_price" }
)
.refine(
  (input) => {
    if (input.min_total_units === undefined || input.max_total_units === undefined) return true;
    return input.min_total_units <= input.max_total_units;
  },
  { message: "min_total_units must be less than or equal to max_total_units" }
);

const ORDER_BY: Record<z.infer<typeof sortSchema>, string> = {
  latest: "latest.deal_date DESC NULLS LAST, scored.rank_score DESC, c.id DESC",
  price_desc: "latest.deal_amount_manwon DESC NULLS LAST, scored.rank_score DESC, c.id DESC",
  price_asc: "latest.deal_amount_manwon ASC NULLS LAST, scored.rank_score DESC, c.id DESC",
  deal_count: "stats.deal_count_3m DESC, latest.deal_date DESC NULLS LAST, c.id DESC"
};

const SEARCH_CACHE_TTL_MS = 5_000;
const SEARCH_CACHE = new Map<string, { expiresAt: number; payload: unknown }>();

const AUTO_PREWARM_KEYWORDS = ["더가온", "금강프라임빌", "래미안", "자이"];
let autoPrewarmStarted = false;

function getBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

function triggerAutoPrewarm() {
  if (autoPrewarmStarted) return;
  autoPrewarmStarted = true;

  const baseUrl = getBaseUrl();
  const keywords = (process.env.PREWARM_KEYWORDS ?? AUTO_PREWARM_KEYWORDS.join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  void Promise.allSettled(
    keywords.map(async (q) => {
      const sp = new URLSearchParams({ q, page: "1", size: "24", sort: "latest", lite: "true", _warm: "1" });
      await fetch(`${baseUrl}/api/search?${sp.toString()}`, { cache: "no-store" });
    })
  );
}

function normKey(name: string, dong: string): string {
  const norm = (v: string) => v.toLowerCase().replace(/[^0-9a-z가-힣]/gi, "");
  return `${norm(name)}|${norm(dong)}`;
}

const SOOTJA_CACHE_TTL_MS = 8_000;
const SOOTJA_CACHE = new Map<string, { expiresAt: number; payload: { items: unknown[]; total: number } }>();

type CombinedSearchRow = {
  property_type?: string;
  complex_name?: string;
  sggcd_list?: unknown;
  umdnm_list?: unknown;
};

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((v) => v.trim()).filter(Boolean);
  return [];
}

function rowKind(propertyType: string | undefined): "villa" | "officetel" {
  return (propertyType ?? "").toLowerCase().includes("officetel") ? "officetel" : "villa";
}

function makeExternalHrefFromCombined(row: CombinedSearchRow): string {
  const kind = rowKind(row.property_type);
  const sggCd = toStringList(row.sggcd_list)[0] ?? "";
  const umdNm = toStringList(row.umdnm_list)[0] ?? "";
  const name = String(row.complex_name ?? "");
  const sp = new URLSearchParams({ kind, sggCd, umdNm, name });
  return `/rowhouses/external?${sp.toString()}`;
}

function resolveSootjaApiKey(): string {
  const raw = (process.env.SOOTJA_API_KEY ?? process.env.API_KEY ?? "").trim();
  if (!raw) return "";
  const fromEq = raw.includes("=") ? raw.slice(raw.lastIndexOf("=") + 1).trim() : raw;
  return fromEq.replace(/^['\"]|['\"]$/g, "").trim();
}

async function fetchSootjaCombinedSearch(q: string, pageSize: number) {
  const apiKey = resolveSootjaApiKey();
  const base = process.env.SOOTJA_API_BASE_URL ?? "https://sootja.kr/api";
  if (!apiKey || q.trim().length < 2) return { items: [], total: 0 };

  const key = `/v1/search|${q}|${pageSize}`;
  const cached = SOOTJA_CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.payload;

  const sp = new URLSearchParams({ api_key: apiKey, q, page: "1", page_size: String(Math.min(pageSize, 1000)) });
  const res = await fetch(`${base}/v1/search?${sp.toString()}`, { cache: "no-store" });
  if (!res.ok) return { items: [], total: 0 };
  const json = await res.json();
  const payload = { items: Array.isArray(json?.items) ? json.items : [], total: Number(json?.total ?? 0) };
  SOOTJA_CACHE.set(key, { expiresAt: Date.now() + SOOTJA_CACHE_TTL_MS, payload });
  return payload;
}

function parseExactOnly(params: URLSearchParams): boolean {
  const raw = params.get("exact_only");
  return raw === "true" || raw === "1";
}

function parseLite(params: URLSearchParams): boolean {
  const raw = params.get("lite");
  return raw === "true" || raw === "1";
}

export async function GET(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    if (!req.nextUrl.searchParams.has("_warm")) {
      triggerAutoPrewarm();
    }

    if (!hasDatabaseUrl()) {
      status = 503;
      return NextResponse.json({ ok: false, code: "DB_NOT_CONFIGURED", error: "DATABASE_URL is not configured" }, { status });
    }

    const params = req.nextUrl.searchParams;
    const exactOnly = parseExactOnly(params);
    const lite = parseLite(params);

    const input = querySchema.parse({
      q: params.get("q"),
      region: params.get("region") ?? undefined,
      min_price: params.get("min_price") ?? undefined,
      max_price: params.get("max_price") ?? undefined,
      max_age_years: params.get("max_age_years") ?? undefined,
      min_total_units: params.get("min_total_units") ?? undefined,
      max_total_units: params.get("max_total_units") ?? undefined,
      sw_lat: params.get("sw_lat") ?? undefined,
      sw_lng: params.get("sw_lng") ?? undefined,
      ne_lat: params.get("ne_lat") ?? undefined,
      ne_lng: params.get("ne_lng") ?? undefined,
      sort: params.get("sort") ?? "latest",
      page: params.get("page") ?? 1,
      size: params.get("size") ?? 20
    });

    const offset = (input.page - 1) * input.size;
    const pool = getDbPool();
    const effectiveSort: z.infer<typeof sortSchema> = lite && input.sort === "deal_count" ? "latest" : input.sort;
    const matcher = buildSearchMatcher(input.q);
    const cacheKey = req.nextUrl.search;
    const cached = SEARCH_CACHE.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.payload);
    }
    const orderBy = ORDER_BY[effectiveSort];
    const dealCountSelect = lite ? "0::INT AS deal_count_3m," : "stats.deal_count_3m,";
    const totalCountSelect = lite ? "0::BIGINT AS total_count" : "COUNT(*) OVER() AS total_count";
    const statsJoin = lite
      ? ""
      : `
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::INT AS deal_count_3m
        FROM deal_trade_normalized d
        WHERE d.complex_id = c.id
          AND d.deal_date >= (CURRENT_DATE - INTERVAL '3 months')
      ) stats ON true`;

    const combinedPromise = lite
      ? fetchSootjaCombinedSearch(input.q, input.size)
      : Promise.resolve({ items: [], total: 0 });

    let result;

    if (lite) {
      const liteSql = `
        SELECT
          c.id,
          c.apt_name,
          c.legal_dong,
          c.location_source,
          c.build_year,
          c.total_units,
          c.updated_at AS complex_updated_at,
          r.code AS region_code,
          r.name_ko AS region_name,
          ST_Y(c.location::geometry) AS lat,
          ST_X(c.location::geometry) AS lng,
          NULL::INT AS deal_amount_manwon,
          NULL::DATE AS deal_date,
          0::INT AS deal_count_3m,
          0::BIGINT AS total_count
        FROM complex c
        JOIN region r ON r.id = c.region_id
        CROSS JOIN LATERAL (
          SELECT lower(regexp_replace(coalesce(c.apt_name, '') || coalesce(c.legal_dong, ''), '[^0-9a-zA-Z가-힣]', '', 'g')) AS text_norm
        ) norm
        CROSS JOIN LATERAL (
          SELECT
            CASE
              WHEN c.apt_name ILIKE $12 THEN 300
              WHEN c.legal_dong ILIKE $12 THEN 250
              WHEN c.apt_name ILIKE $1 THEN 180
              WHEN c.legal_dong ILIKE $1 THEN 140
              WHEN $16::TEXT IS NOT NULL AND norm.text_norm LIKE $16 THEN 200
              ELSE 0
            END
            + CASE
              WHEN $17::TEXT[] IS NOT NULL AND EXISTS (
                SELECT 1
                FROM unnest($17::TEXT[]) p
                WHERE p <> '' AND norm.text_norm LIKE ('%' || p || '%')
              ) THEN 60
              ELSE 0
            END
            + CASE
              WHEN $18::TEXT[] IS NOT NULL
               AND cardinality($18) > 0
               AND NOT EXISTS (
                 SELECT 1
                 FROM unnest($18::TEXT[]) t
                 WHERE t <> '' AND norm.text_norm NOT LIKE ('%' || t || '%')
               ) THEN 80
              ELSE 0
            END
            + CASE
              WHEN $19::TEXT[] IS NOT NULL
               AND EXISTS (
                 SELECT 1
                 FROM unnest($19::TEXT[]) s
                 WHERE split_part(s, '|', 1) <> ''
                   AND split_part(s, '|', 2) <> ''
                   AND norm.text_norm LIKE ('%' || split_part(s, '|', 1) || '%')
                   AND norm.text_norm LIKE ('%' || split_part(s, '|', 2) || '%')
               ) THEN 70
              ELSE 0
            END AS rank_score
        ) scored
        WHERE
          (
            c.apt_name ILIKE $1
            OR c.legal_dong ILIKE $1
            OR ($16::TEXT IS NOT NULL AND norm.text_norm LIKE $16)
            OR (
              $17::TEXT[] IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM unnest($17::TEXT[]) p
                WHERE p <> '' AND norm.text_norm LIKE ('%' || p || '%')
              )
            )
            OR (
              $18::TEXT[] IS NOT NULL
              AND cardinality($18) > 0
              AND NOT EXISTS (
                SELECT 1
                FROM unnest($18::TEXT[]) t
                WHERE t <> '' AND norm.text_norm NOT LIKE ('%' || t || '%')
              )
            )
            OR (
              $19::TEXT[] IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM unnest($19::TEXT[]) s
                WHERE split_part(s, '|', 1) <> ''
                  AND split_part(s, '|', 2) <> ''
                  AND norm.text_norm LIKE ('%' || split_part(s, '|', 1) || '%')
                  AND norm.text_norm LIKE ('%' || split_part(s, '|', 2) || '%')
              )
            )
          )
          AND ($2::VARCHAR IS NULL OR r.code = $2)
          AND ($3::INT IS NULL OR true)
          AND ($4::INT IS NULL OR true)
          AND ($11::BOOLEAN = false OR c.location_source = 'exact')
          AND (
            $13::INT IS NULL
            OR (
              c.build_year IS NOT NULL
              AND (EXTRACT(YEAR FROM CURRENT_DATE)::INT - c.build_year) <= $13
            )
          )
          AND ($14::INT IS NULL OR c.total_units >= $14)
          AND ($15::INT IS NULL OR c.total_units <= $15)
          AND (
            $7::DOUBLE PRECISION IS NULL
            OR $8::DOUBLE PRECISION IS NULL
            OR $9::DOUBLE PRECISION IS NULL
            OR $10::DOUBLE PRECISION IS NULL
            OR (
              c.location IS NOT NULL
              AND ST_Intersects(c.location, ST_MakeEnvelope($8, $7, $10, $9, 4326))
            )
          )
        ORDER BY scored.rank_score DESC, c.id DESC
        LIMIT $5 OFFSET $6
      `;

      result = await pool.query(liteSql, [
        matcher.qLike,
        input.region ?? null,
        input.min_price ?? null,
        input.max_price ?? null,
        input.size,
        offset,
        input.sw_lat ?? null,
        input.sw_lng ?? null,
        input.ne_lat ?? null,
        input.ne_lng ?? null,
        exactOnly,
        matcher.qExact,
        input.max_age_years ?? null,
        input.min_total_units ?? null,
        input.max_total_units ?? null,
        matcher.qNormLike,
        matcher.patternTerms,
        matcher.andTokens,
        matcher.splitPairTokens
      ]);
    } else {
      const sql = `
        SELECT
          c.id,
          c.apt_name,
          c.legal_dong,
          c.location_source,
          c.build_year,
          c.total_units,
          c.updated_at AS complex_updated_at,
          r.code AS region_code,
          r.name_ko AS region_name,
          ST_Y(c.location::geometry) AS lat,
          ST_X(c.location::geometry) AS lng,
          latest.deal_amount_manwon,
          latest.deal_date,
          ${dealCountSelect}
          ${totalCountSelect}
        FROM complex c
        JOIN region r ON r.id = c.region_id
        LEFT JOIN LATERAL (
          SELECT d.deal_amount_manwon, d.deal_date
          FROM deal_trade_normalized d
          WHERE d.complex_id = c.id
          ORDER BY d.deal_date DESC
          LIMIT 1
        ) latest ON true
        ${statsJoin}
        CROSS JOIN LATERAL (
          SELECT lower(regexp_replace(coalesce(c.apt_name, '') || coalesce(c.legal_dong, ''), '[^0-9a-zA-Z가-힣]', '', 'g')) AS text_norm
        ) norm
        CROSS JOIN LATERAL (
          SELECT
            CASE
              WHEN c.apt_name ILIKE $12 THEN 300
              WHEN c.legal_dong ILIKE $12 THEN 250
              WHEN c.apt_name ILIKE $1 THEN 180
              WHEN c.legal_dong ILIKE $1 THEN 140
              WHEN $16::TEXT IS NOT NULL AND norm.text_norm LIKE $16 THEN 200
              ELSE 0
            END
            + CASE
              WHEN $17::TEXT[] IS NOT NULL AND EXISTS (
                SELECT 1
                FROM unnest($17::TEXT[]) p
                WHERE p <> '' AND norm.text_norm LIKE ('%' || p || '%')
              ) THEN 60
              ELSE 0
            END
            + CASE
              WHEN $18::TEXT[] IS NOT NULL
               AND cardinality($18) > 0
               AND NOT EXISTS (
                 SELECT 1
                 FROM unnest($18::TEXT[]) t
                 WHERE t <> '' AND norm.text_norm NOT LIKE ('%' || t || '%')
               ) THEN 80
              ELSE 0
            END
            + CASE
              WHEN $19::TEXT[] IS NOT NULL
               AND EXISTS (
                 SELECT 1
                 FROM unnest($19::TEXT[]) s
                 WHERE split_part(s, '|', 1) <> ''
                   AND split_part(s, '|', 2) <> ''
                   AND norm.text_norm LIKE ('%' || split_part(s, '|', 1) || '%')
                   AND norm.text_norm LIKE ('%' || split_part(s, '|', 2) || '%')
               ) THEN 70
              ELSE 0
            END
            + CASE
              WHEN latest.deal_date >= (CURRENT_DATE - INTERVAL '30 days') THEN 40
              WHEN latest.deal_date >= (CURRENT_DATE - INTERVAL '90 days') THEN 20
              ELSE 0
            END AS rank_score
        ) scored
        WHERE
          (
            c.apt_name ILIKE $1
            OR c.legal_dong ILIKE $1
            OR ($16::TEXT IS NOT NULL AND norm.text_norm LIKE $16)
            OR (
              $17::TEXT[] IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM unnest($17::TEXT[]) p
                WHERE p <> '' AND norm.text_norm LIKE ('%' || p || '%')
              )
            )
            OR (
              $18::TEXT[] IS NOT NULL
              AND cardinality($18) > 0
              AND NOT EXISTS (
                SELECT 1
                FROM unnest($18::TEXT[]) t
                WHERE t <> '' AND norm.text_norm NOT LIKE ('%' || t || '%')
              )
            )
            OR (
              $19::TEXT[] IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM unnest($19::TEXT[]) s
                WHERE split_part(s, '|', 1) <> ''
                  AND split_part(s, '|', 2) <> ''
                  AND norm.text_norm LIKE ('%' || split_part(s, '|', 1) || '%')
                  AND norm.text_norm LIKE ('%' || split_part(s, '|', 2) || '%')
              )
            )
          )
          AND ($2::VARCHAR IS NULL OR r.code = $2)
          AND ($3::INT IS NULL OR latest.deal_amount_manwon >= $3)
          AND ($4::INT IS NULL OR latest.deal_amount_manwon <= $4)
          AND ($11::BOOLEAN = false OR c.location_source = 'exact')
          AND (
            $13::INT IS NULL
            OR (
              c.build_year IS NOT NULL
              AND (EXTRACT(YEAR FROM CURRENT_DATE)::INT - c.build_year) <= $13
            )
          )
          AND ($14::INT IS NULL OR c.total_units >= $14)
          AND ($15::INT IS NULL OR c.total_units <= $15)
          AND (
            $7::DOUBLE PRECISION IS NULL
            OR $8::DOUBLE PRECISION IS NULL
            OR $9::DOUBLE PRECISION IS NULL
            OR $10::DOUBLE PRECISION IS NULL
            OR (
              c.location IS NOT NULL
              AND ST_Intersects(c.location, ST_MakeEnvelope($8, $7, $10, $9, 4326))
            )
          )
        ORDER BY ${orderBy}
        LIMIT $5 OFFSET $6
      `;

      result = await pool.query(sql, [
        matcher.qLike,
        input.region ?? null,
        input.min_price ?? null,
        input.max_price ?? null,
        input.size,
        offset,
        input.sw_lat ?? null,
        input.sw_lng ?? null,
        input.ne_lat ?? null,
        input.ne_lng ?? null,
        exactOnly,
        matcher.qExact,
        input.max_age_years ?? null,
        input.min_total_units ?? null,
        input.max_total_units ?? null,
        matcher.qNormLike,
        matcher.patternTerms,
        matcher.andTokens,
        matcher.splitPairTokens
      ]);
    }

    const mappedItems = result.rows.map((row) => {
      const locationQuality = row.location_source === "exact" ? "exact" : "approx";
      return {
        id: String(row.id),
        apt_name: row.apt_name,
        legal_dong: row.legal_dong ?? "",
        region_code: row.region_code,
        region_name: row.region_name,
        lat: row.lat === null ? null : Number(row.lat),
        lng: row.lng === null ? null : Number(row.lng),
        deal_amount_manwon: row.deal_amount_manwon === null ? null : Number(row.deal_amount_manwon),
        deal_date: row.deal_date ? new Date(row.deal_date).toISOString() : null,
        build_year: row.build_year === null ? null : Number(row.build_year),
        total_units: row.total_units === null ? null : Number(row.total_units),
        deal_count_3m: Number(row.deal_count_3m ?? 0),
        property_type: "apartment",
        detail_href: `/complexes/${row.id}`,
        locationQuality,
        location_source: locationQuality,
        locationSource: locationQuality
      };
    });

    let mergedItems = mappedItems;
    if (lite) {
      let combined: { items: unknown[]; total: number } = { items: [], total: 0 };
      try {
        combined = await combinedPromise;
      } catch {
        combined = { items: [], total: 0 };
      }

      const extraItems: Array<(typeof mappedItems)[number]> = combined.items.map((raw: unknown) => {
        const r = raw as CombinedSearchRow;
        const kind = rowKind(r.property_type);
        const sggCd = toStringList(r.sggcd_list)[0] ?? "";
        const umdNm = toStringList(r.umdnm_list)[0] ?? "";
        const complexName = String(r.complex_name ?? "");
        return {
          id: `${kind}:${sggCd}:${complexName}:${umdNm}`,
          apt_name: complexName,
          legal_dong: umdNm,
          region_code: sggCd,
          region_name: sggCd,
          lat: null,
          lng: null,
          deal_amount_manwon: null,
          deal_date: null,
          build_year: null,
          total_units: null,
          deal_count_3m: 0,
          property_type: kind,
          detail_href: makeExternalHrefFromCombined(r),
          locationQuality: "approx",
          location_source: "approx",
          locationSource: "approx"
        };
      });

      const villaItems = extraItems.filter((x) => x.property_type === "villa");
      if (villaItems.length > 0) {
        const dongs = Array.from(new Set(villaItems.map((x) => x.legal_dong).filter(Boolean)));
        const codes = Array.from(new Set(villaItems.map((x) => x.region_code).filter(Boolean)));
        if (dongs.length > 0 && codes.length > 0) {
          const db = await pool.query(
            `
            SELECT c.id, c.apt_name, c.legal_dong, r.code AS region_code
            FROM complex c
            JOIN region r ON r.id = c.region_id
            WHERE c.legal_dong = ANY($1::text[])
              AND r.code = ANY($2::text[])
            `,
            [dongs, codes]
          );
          const byDongCode = new Map<string, Array<{ id: number; apt_name: string }>>();
          for (const row of db.rows) {
            const key = `${row.legal_dong}|${row.region_code}`;
            const arr = byDongCode.get(key) ?? [];
            arr.push({ id: Number(row.id), apt_name: String(row.apt_name ?? "") });
            byDongCode.set(key, arr);
          }
          const n = (v: string) => v.toLowerCase().replace(/[^0-9a-z가-힣]/gi, "");
          for (const item of villaItems) {
            const key = `${item.legal_dong}|${item.region_code}`;
            const candidates = byDongCode.get(key) ?? [];
            const target = n(item.apt_name ?? "");
            const found = candidates.find((c) => {
              const cName = n(c.apt_name);
              return cName === target || cName.includes(target) || target.includes(cName);
            });
            if (found) item.detail_href = `/rowhouses/${found.id}`;
          }
        }
      }

      const byKey = new Map<string, (typeof mappedItems)[number]>();
      for (const item of [...mappedItems, ...extraItems]) {
        const key = normKey(item.apt_name ?? "", item.legal_dong ?? "");
        const prev = byKey.get(key);
        if (!prev) {
          byKey.set(key, item as (typeof mappedItems)[number]);
          continue;
        }
        const prevTs = prev.deal_date ? new Date(prev.deal_date).getTime() : 0;
        const nextTs = item.deal_date ? new Date(item.deal_date).getTime() : 0;
        if (nextTs > prevTs) byKey.set(key, item as (typeof mappedItems)[number]);
      }
      mergedItems = Array.from(byKey.values())
        .sort((a, b) => new Date(b.deal_date ?? 0).getTime() - new Date(a.deal_date ?? 0).getTime())
        .slice(0, input.size);
    }

    if (lite && mergedItems.length === 0) {
      const qCandidates = Array.from(
        new Set([
          input.q.trim(),
          input.q.replace(/\s+/g, ""),
          input.q.split(/\s+/).filter(Boolean)[0] ?? ""
        ].filter((v) => v.length >= 2))
      ).slice(0, 3);

      for (const q2 of qCandidates) {
        const combinedRes = await fetchSootjaCombinedSearch(q2, input.size);

        const fallbackItems: Array<(typeof mappedItems)[number]> = combinedRes.items.map((raw: unknown) => {
          const r = raw as CombinedSearchRow;
          const kind = rowKind(r.property_type);
          const sggCd = toStringList(r.sggcd_list)[0] ?? "";
          const umdNm = toStringList(r.umdnm_list)[0] ?? "";
          const complexName = String(r.complex_name ?? "");
          return {
            id: `fallback:${kind}:${sggCd}:${complexName}:${umdNm}`,
            apt_name: complexName,
            legal_dong: umdNm,
            region_code: sggCd,
            region_name: sggCd,
            lat: null,
            lng: null,
            deal_amount_manwon: null,
            deal_date: null,
            build_year: null,
            total_units: null,
            deal_count_3m: 0,
            property_type: kind,
            detail_href: makeExternalHrefFromCombined(r),
            locationQuality: "approx",
            location_source: "approx",
            locationSource: "approx"
          };
        });

        if (fallbackItems.length > 0) {
          const byKey = new Map<string, (typeof fallbackItems)[number]>();
          for (const item of fallbackItems) {
            const key = normKey(item.apt_name ?? "", item.legal_dong ?? "");
            const prev = byKey.get(key);
            if (!prev) {
              byKey.set(key, item);
              continue;
            }
            const prevTs = prev.deal_date ? new Date(prev.deal_date).getTime() : 0;
            const nextTs = item.deal_date ? new Date(item.deal_date).getTime() : 0;
            if (nextTs > prevTs) byKey.set(key, item);
          }
          mergedItems = Array.from(byKey.values())
            .sort((a, b) => new Date(b.deal_date ?? 0).getTime() - new Date(a.deal_date ?? 0).getTime())
            .slice(0, input.size);
          break;
        }
      }
    }

    const totalCount = lite
      ? mergedItems.length
      : result.rows.length > 0
        ? Number(result.rows[0].total_count ?? 0)
        : 0;
    const latestTimestamp = mergedItems.reduce((maxTs: number, row) => {
      for (const candidate of [row.deal_date]) {
        if (!candidate) continue;
        const parsedTs = new Date(candidate).getTime();
        if (Number.isFinite(parsedTs) && parsedTs > maxTs) {
          maxTs = parsedTs;
        }
      }
      return maxTs;
    }, 0);
    const updatedAt = latestTimestamp > 0 ? new Date(latestTimestamp).toISOString() : new Date().toISOString();

    const payload = {
      ok: true,
      query: { ...input, exact_only: exactOnly, lite },
      appliedSort: effectiveSort,
      count: mergedItems.length,
      totalCount,
      sourceLabel: "국토교통부 실거래가 공개데이터",
      updatedAt,
      items: mergedItems
    };

    SEARCH_CACHE.set(cacheKey, {
      expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
      payload
    });

    return NextResponse.json(payload);
  } catch (error) {
    logApiError("GET /api/search", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = 400;
    return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: message }, { status });
  } finally {
    recordApiMetric("GET /api/search", performance.now() - started, status);
  }
}

