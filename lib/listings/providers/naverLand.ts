import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ComplexListingItem, ListingDealType } from "@/lib/types";
import type {
  ListingNormalizeContext,
  ListingProviderAdapter,
  ListingProviderFetchParams,
  ListingProviderFetchResult
} from "@/lib/listings/adapters";

/**
 * 네이버 부동산 원본 응답 스캐폴드 타입
 * - 실제 연동 시 필드명을 원본 스펙 기준으로 정교화할 것
 */
export type RawNaverLandListing = {
  listingId?: string | number;
  articleNo?: string | number;
  tradeType?: string | null;
  dealType?: string | null;
  price?: string | number | null;
  priceManwon?: string | number | null;
  deposit?: string | number | null;
  depositManwon?: string | number | null;
  monthlyRent?: string | number | null;
  monthlyRentManwon?: string | number | null;
  area?: string | number | null;
  areaM2?: string | number | null;
  floor?: string | number | null;
  listedAt?: string | null;
  articleConfirmedAt?: string | null;
  url?: string | null;
  sourceName?: string | null;
};

function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^0-9.-]/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntSafe(value: unknown): number | null {
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function mapDealType(raw: RawNaverLandListing): ListingDealType | null {
  const source = (raw.dealType ?? raw.tradeType ?? "").toString().toLowerCase();
  if (source.includes("매매") || source.includes("sale")) return "sale";
  if (source.includes("전세") || source.includes("jeonse")) return "jeonse";
  if (source.includes("월세") || source.includes("wolse")) return "wolse";
  return null;
}

function normalizeListedAt(raw: RawNaverLandListing, fallbackIso: string): string | null {
  const value = raw.listedAt ?? raw.articleConfirmedAt ?? null;
  if (!value) return fallbackIso;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallbackIso;
  return parsed.toISOString();
}

function buildStableListingId(raw: RawNaverLandListing, ctx: ListingNormalizeContext): string | null {
  const fromProvider = raw.listingId ?? raw.articleNo;
  if (fromProvider !== undefined && fromProvider !== null && String(fromProvider).trim()) {
    return `naver_land:${ctx.complexId}:${String(fromProvider).trim()}`;
  }

  const dealType = mapDealType(raw);
  const area = parseNumber(raw.areaM2 ?? raw.area);
  const floor = parseIntSafe(raw.floor);
  const price = parseIntSafe(raw.priceManwon ?? raw.price);
  const deposit = parseIntSafe(raw.depositManwon ?? raw.deposit);
  const monthly = parseIntSafe(raw.monthlyRentManwon ?? raw.monthlyRent);

  if (!dealType) return null;

  // TODO(provider-naver_land): 실연동 시 provider 원본 고유 ID가 항상 들어오도록 강제
  // 임시 합성키(중복 위험이 있어 fallback 전용)
  return `naver_land:${ctx.complexId}:${dealType}:${price ?? "-"}:${deposit ?? "-"}:${monthly ?? "-"}:${area ?? "-"}:${floor ?? "-"}`;
}

export function normalizeNaverLandItem(
  raw: RawNaverLandListing,
  ctx: ListingNormalizeContext
): ComplexListingItem | null {
  const dealType = mapDealType(raw);
  if (!dealType) return null;

  const id = buildStableListingId(raw, ctx);
  if (!id) return null;

  const priceManwon = parseIntSafe(raw.priceManwon ?? raw.price);
  const depositManwon = parseIntSafe(raw.depositManwon ?? raw.deposit);
  const monthlyRentManwon = parseIntSafe(raw.monthlyRentManwon ?? raw.monthlyRent);
  const areaM2 = parseNumber(raw.areaM2 ?? raw.area);
  const floor = parseIntSafe(raw.floor);

  return {
    id,
    dealType,
    priceManwon,
    depositManwon,
    monthlyRentManwon,
    areaM2,
    floor,
    sourceName: raw.sourceName ?? "네이버부동산",
    listedAt: normalizeListedAt(raw, ctx.nowIso),
    url: raw.url ?? null
  };
}

function buildSecondaryDedupeKey(item: ComplexListingItem): string {
  return [
    item.dealType,
    item.priceManwon ?? "-",
    item.depositManwon ?? "-",
    item.monthlyRentManwon ?? "-",
    item.areaM2 ?? "-",
    item.floor ?? "-",
    item.listedAt ?? "-"
  ].join(":");
}

function listedAtMs(item: ComplexListingItem): number {
  if (!item.listedAt) return Number.NEGATIVE_INFINITY;
  const ms = new Date(item.listedAt).getTime();
  return Number.isFinite(ms) ? ms : Number.NEGATIVE_INFINITY;
}

function pickPreferred(a: ComplexListingItem, b: ComplexListingItem): ComplexListingItem {
  // 1) listedAt 최신 우선
  const aMs = listedAtMs(a);
  const bMs = listedAtMs(b);
  if (aMs !== bMs) return aMs > bMs ? a : b;

  // 2) URL 있는 항목 우선
  const aHasUrl = Boolean(a.url);
  const bHasUrl = Boolean(b.url);
  if (aHasUrl !== bHasUrl) return aHasUrl ? a : b;

  // 3) 안정성: 기존(a) 유지
  return a;
}

export function dedupeNaverLandListings(items: ComplexListingItem[]): ComplexListingItem[] {
  const byPrimary = new Map<string, ComplexListingItem>();

  for (const item of items) {
    const prev = byPrimary.get(item.id);
    if (!prev) {
      byPrimary.set(item.id, item);
      continue;
    }
    byPrimary.set(item.id, pickPreferred(prev, item));
  }

  const bySecondary = new Map<string, ComplexListingItem>();
  for (const item of byPrimary.values()) {
    const key = buildSecondaryDedupeKey(item);
    const prev = bySecondary.get(key);
    if (!prev) {
      bySecondary.set(key, item);
      continue;
    }
    bySecondary.set(key, pickPreferred(prev, item));
  }

  return Array.from(bySecondary.values()).sort((a, b) => listedAtMs(b) - listedAtMs(a));
}

export async function fetchNaverLandRaw(
  params: ListingProviderFetchParams
): Promise<ListingProviderFetchResult<RawNaverLandListing>> {
  if (params.fixture === "sample") {
    const fixturePath = join(process.cwd(), "lib", "listings", "providers", "fixtures", "naverLand.sample.json");
    const raw = await readFile(fixturePath, "utf8");
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? (parsed as RawNaverLandListing[]) : [];

    return {
      items,
      totalCount: items.length,
      sourceLabel: "네이버부동산(샘플 fixture)",
      updatedAt: new Date().toISOString(),
      rawMeta: {
        provider: "naver_land",
        fixture: "sample",
        page: params.page,
        size: params.size,
        complexId: params.complexId,
        note: "fixture_mode"
      }
    };
  }

  // TODO(provider-naver_land): 실제 provider 연동 구현
  // 1) 접근 정책/약관 검토
  // 2) 호출 endpoint 확정 + 인증/헤더 반영
  // 3) timeout/retry/rate-limit 처리
  // 4) rawMeta에 원본 응답 메타(page, hasMore, requestId 등) 적재

  return {
    items: [],
    totalCount: 0,
    sourceLabel: "네이버부동산(연동 준비중)",
    updatedAt: new Date().toISOString(),
    rawMeta: {
      provider: "naver_land",
      page: params.page,
      size: params.size,
      complexId: params.complexId,
      note: "scaffold"
    }
  };
}

export const naverLandAdapter: ListingProviderAdapter<RawNaverLandListing> = {
  key: "naver_land",
  version: "v1",
  fetchRaw: fetchNaverLandRaw,
  normalizeItem: normalizeNaverLandItem,
  normalizeMany(items, ctx) {
    const normalized: ComplexListingItem[] = [];
    for (const raw of items) {
      const item = normalizeNaverLandItem(raw, ctx);
      if (item) normalized.push(item);
    }
    return dedupeNaverLandListings(normalized);
  }
};
