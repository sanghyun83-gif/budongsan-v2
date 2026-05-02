import { NextRequest, NextResponse } from "next/server";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";

function parseNum(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  const n = Number(String(input).replaceAll(",", "").trim());
  return Number.isFinite(n) ? n : null;
}

function toIsoDate(year?: string, month?: string, day?: string): string | null {
  if (!year || !month || !day) return null;
  const d = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+09:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.SOOTJA_API_KEY ?? process.env.API_KEY;
    const base = process.env.SOOTJA_API_BASE_URL ?? "https://sootja.kr/api";
    if (!apiKey) {
      return NextResponse.json({ ok: false, code: "SOOTJA_KEY_MISSING", error: "SOOTJA_API_KEY is not configured" }, { status: 503 });
    }

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const size = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("size") ?? "20")));
    if (!q) {
      return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: "q is required" }, { status: 400 });
    }

    const sp = new URLSearchParams({ api_key: apiKey, q, page: String(page), page_size: String(size) });
    const started = performance.now();
    const res = await fetch(`${base}/v1/dasaedae/trade/search?${sp.toString()}`, { cache: "no-store" });
    const latencyMs = Math.round(performance.now() - started);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, code: "SOOTJA_API_ERROR", error: text || `HTTP ${res.status}` }, { status: 502 });
    }

    const json = await res.json();
    const rawItems = (json?.items ?? []) as Array<Record<string, string>>;
    const items = rawItems.map((row) => ({
      aptName: row.mhousenm ?? "",
      legalDong: row.umdnm ?? "",
      sggCd: row.sggcd ?? "",
      dealDate: toIsoDate(row.dealyear, row.dealmonth, row.dealday),
      dealAmountManwon: parseNum(row.dealamount),
      areaM2: parseNum(row.excluusear),
      rowhouseId: null as number | null
    }));

    if (hasDatabaseUrl() && items.length > 0) {
      const pool = getDbPool();
      const names = Array.from(new Set(items.map((i) => i.aptName).filter(Boolean)));
      const dongs = Array.from(new Set(items.map((i) => i.legalDong).filter(Boolean)));
      const codes = Array.from(new Set(items.map((i) => i.sggCd).filter(Boolean)));
      if (names.length > 0 && dongs.length > 0 && codes.length > 0) {
        const db = await pool.query(
          `
          SELECT c.id, c.apt_name, c.legal_dong, r.code AS region_code
          FROM complex c
          JOIN region r ON r.id = c.region_id
          WHERE c.apt_name = ANY($1::text[])
            AND c.legal_dong = ANY($2::text[])
            AND r.code = ANY($3::text[])
          `,
          [names, dongs, codes]
        );
        const byKey = new Map<string, number>();
        for (const row of db.rows) {
          byKey.set(`${row.apt_name}|${row.legal_dong}|${row.region_code}`, Number(row.id));
        }
        for (const item of items) {
          item.rowhouseId = byKey.get(`${item.aptName}|${item.legalDong}|${item.sggCd}`) ?? null;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      query: q,
      page: Number(json?.page ?? page),
      pageSize: Number(json?.page_size ?? size),
      total: Number(json?.total ?? items.length),
      latencyMs,
      items
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, code: "INTERNAL_ERROR", error: message }, { status: 500 });
  }
}
