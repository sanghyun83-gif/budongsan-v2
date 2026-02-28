import { z } from "zod";
import type { ApartmentDeal } from "@/lib/types";

const API_BASE = "https://apis.data.go.kr/1613000";
const TRADE_ENDPOINT = `${API_BASE}/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev`;

const querySchema = z.object({
  regionCode: z.string().regex(/^\d{5}$/),
  dealYmd: z.string().regex(/^\d{6}$/)
});

function parseNumber(raw: string | undefined): number {
  if (!raw) return 0;
  return Number(raw.replace(/,/g, "").trim()) || 0;
}

function extract(xml: string, tag: string): string | undefined {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return m?.[1]?.trim();
}

function parseItems(xml: string): Record<string, string>[] {
  const resultCode = extract(xml, "resultCode");
  if (resultCode !== "00" && resultCode !== "000") {
    const resultMsg = extract(xml, "resultMsg") ?? "Unknown API error";
    throw new Error(`MOLIT API error ${resultCode}: ${resultMsg}`);
  }

  const chunks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
  return chunks.map((chunk) => {
    const out: Record<string, string> = {};
    const matches = chunk.matchAll(/<([^>]+)>([^<]*)<\/\1>/g);
    for (const m of matches) {
      out[m[1]] = m[2];
    }
    return out;
  });
}

function parseDeal(raw: Record<string, string>, regionCode: string): ApartmentDeal {
  const aptName = raw.aptNm?.trim() || raw.아파트?.trim() || "Unknown";
  const legalDong = raw.umdNm?.trim() || raw.법정동?.trim() || "";
  const dealAmount = parseNumber(raw.dealAmount ?? raw.거래금액);
  const dealYear = parseNumber(raw.dealYear ?? raw.년);
  const dealMonth = parseNumber(raw.dealMonth ?? raw.월);
  const dealDay = parseNumber(raw.dealDay ?? raw.일);
  const areaM2 = Number(raw.excluUseAr ?? raw.전용면적 ?? "0") || 0;
  const floor = parseNumber(raw.floor ?? raw.층);
  const buildYear = parseNumber(raw.buildYear ?? raw.건축년도);

  const aptId = `${regionCode}-${aptName.replace(/\s+/g, "-").toLowerCase()}`;

  return {
    aptId,
    regionCode,
    aptName,
    legalDong,
    dealAmount,
    dealYear,
    dealMonth,
    dealDay,
    areaM2,
    floor,
    buildYear
  };
}

export function getCurrentDealYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

async function fetchTrade(regionCode: string, dealYmd: string): Promise<ApartmentDeal[]> {
  const key = process.env.DATA_GO_KR_API_KEY;
  if (!key) {
    throw new Error("Missing DATA_GO_KR_API_KEY");
  }

  const validated = querySchema.parse({ regionCode, dealYmd });
  const url = new URL(TRADE_ENDPOINT);
  url.searchParams.set("serviceKey", key);
  url.searchParams.set("LAWD_CD", validated.regionCode);
  url.searchParams.set("DEAL_YMD", validated.dealYmd);
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("pageNo", "1");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`MOLIT request failed: ${res.status}`);
  }

  const xml = await res.text();
  return parseItems(xml).map((item) => parseDeal(item, validated.regionCode));
}

export async function getRecentDeals(regionCode: string, months = 3): Promise<ApartmentDeal[]> {
  const now = new Date();
  const all: ApartmentDeal[] = [];

  for (let i = 0; i < months; i += 1) {
    const d = addMonths(now, -i);
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
    const deals = await fetchTrade(regionCode, ymd);
    all.push(...deals);
  }

  return all.sort((a, b) => {
    const da = new Date(a.dealYear, a.dealMonth - 1, a.dealDay).getTime();
    const db = new Date(b.dealYear, b.dealMonth - 1, b.dealDay).getTime();
    return db - da;
  });
}

export async function getTopDeals(regionCode: string, months = 3, limit = 50): Promise<ApartmentDeal[]> {
  const deals = await getRecentDeals(regionCode, months);
  return deals.sort((a, b) => b.dealAmount - a.dealAmount).slice(0, limit);
}

