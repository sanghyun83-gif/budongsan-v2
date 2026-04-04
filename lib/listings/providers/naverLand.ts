import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ComplexListingItem, ListingDealType } from "@/lib/types";
import type {
  ListingNormalizeContext,
  ListingProviderAdapter,
  ListingProviderFetchParams,
  ListingProviderFetchResult
} from "@/lib/listings/adapters";

const LIVE_ENABLED = process.env.LISTINGS_NAVER_LIVE_ENABLED === "true";
const LIVE_ENDPOINT = (process.env.LISTINGS_NAVER_LIVE_ENDPOINT ?? "").trim();
const REQUEST_TIMEOUT_MS = Number(process.env.LISTINGS_NAVER_TIMEOUT_MS ?? 3500);
const REQUEST_RETRY_COUNT = Number(process.env.LISTINGS_NAVER_RETRY_COUNT ?? 1);

function toPositiveInt(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
}

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
  const nowIso = new Date().toISOString();

  if (params.fixture === "sample") {
    const fixturePath = join(process.cwd(), "lib", "listings", "providers", "fixtures", "naverLand.sample.json");
    const raw = await readFile(fixturePath, "utf8");
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? (parsed as RawNaverLandListing[]) : [];

    return {
      items,
      totalCount: items.length,
      sourceLabel: "네이버부동산(샘플 fixture)",
      updatedAt: nowIso,
      rawMeta: {
        provider: "naver_land",
        mode: "fixture",
        integrationStatus: "pending",
        fixture: "sample",
        page: params.page,
        size: params.size,
        complexId: params.complexId,
        note: "fixture_mode"
      }
    };
  }

  if (!LIVE_ENABLED || !LIVE_ENDPOINT) {
    return {
      items: [],
      totalCount: 0,
      sourceLabel: "네이버부동산(연동 준비중)",
      updatedAt: nowIso,
      rawMeta: {
        provider: "naver_land",
        mode: "placeholder",
        integrationStatus: "pending",
        page: params.page,
        size: params.size,
        complexId: params.complexId,
        liveEnabled: LIVE_ENABLED,
        hasEndpoint: Boolean(LIVE_ENDPOINT),
        note: "live_disabled_or_endpoint_missing"
      }
    };
  }

  const timeoutMs = toPositiveInt(REQUEST_TIMEOUT_MS, 3500);
  const retryCount = toPositiveInt(REQUEST_RETRY_COUNT, 1);
  const apiUrl = new URL(LIVE_ENDPOINT);
  apiUrl.searchParams.set("complexId", String(params.complexId));
  apiUrl.searchParams.set("page", String(params.page));
  apiUrl.searchParams.set("size", String(params.size));
  apiUrl.searchParams.set("dealType", params.dealType);
  apiUrl.searchParams.set("propertyType", params.propertyType);

  let attempt = 0;
  let lastError = "unknown_error";

  while (attempt <= retryCount) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(apiUrl.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        lastError = `http_${response.status}`;
        attempt += 1;
        continue;
      }

      const json = (await response.json()) as { items?: unknown[]; totalCount?: number };
      const items = Array.isArray(json.items) ? (json.items as RawNaverLandListing[]) : [];

      return {
        items,
        totalCount: typeof json.totalCount === "number" ? json.totalCount : items.length,
        sourceLabel: "네이버부동산(실연동)",
        updatedAt: new Date().toISOString(),
        rawMeta: {
          provider: "naver_land",
          mode: "live",
          integrationStatus: "active",
          page: params.page,
          size: params.size,
          complexId: params.complexId,
          attempts: attempt + 1
        }
      };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error instanceof Error ? error.message : String(error);
      attempt += 1;
    }
  }

  return {
    items: [],
    totalCount: 0,
    sourceLabel: "네이버부동산(실연동 오류)",
    updatedAt: new Date().toISOString(),
    rawMeta: {
      provider: "naver_land",
      mode: "live",
      integrationStatus: "error",
      page: params.page,
      size: params.size,
      complexId: params.complexId,
      retryCount,
      error: lastError,
      note: "live_fetch_failed"
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
