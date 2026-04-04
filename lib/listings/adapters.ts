import type { ComplexListingItem, ListingDealType } from "@/lib/types";
import { naverLandAdapter } from "@/lib/listings/providers/naverLand";

export type ListingPropertyType = "apartment";

export type ListingProviderKey =
  | "placeholder"
  | "naver_land"
  | "zigbang"
  | "dabang"
  | "kb_land";

export interface ListingProviderFetchParams {
  complexId: number;
  page: number;
  size: number;
  dealType: ListingDealType | "all";
  propertyType: ListingPropertyType;
  fixture?: "sample";
  signal?: AbortSignal;
}

export interface ListingProviderFetchResult<TRaw = unknown> {
  items: TRaw[];
  totalCount?: number;
  sourceLabel?: string;
  updatedAt?: string;
  rawMeta?: Record<string, unknown>;
}

export interface ListingNormalizeContext {
  complexId: number;
  dealType: ListingDealType | "all";
  propertyType: ListingPropertyType;
  nowIso: string;
}

/**
 * Provider별 표준 normalize 시그니처
 * - 입력: provider 원본 row
 * - 출력: ComplexListingItem(표준 스키마) 또는 null(버림)
 */
export type NormalizeListingFn<TRaw> = (raw: TRaw, ctx: ListingNormalizeContext) => ComplexListingItem | null;

export interface ListingProviderAdapter<TRaw = unknown> {
  key: ListingProviderKey;
  version: "v1";
  fetchRaw: (params: ListingProviderFetchParams) => Promise<ListingProviderFetchResult<TRaw>>;
  normalizeItem: NormalizeListingFn<TRaw>;
  normalizeMany?: (items: TRaw[], ctx: ListingNormalizeContext) => ComplexListingItem[];
}

const placeholderAdapter: ListingProviderAdapter = {
  key: "placeholder",
  version: "v1",
  async fetchRaw() {
    return {
      items: [],
      totalCount: 0,
      sourceLabel: "매물 연동 준비중",
      updatedAt: new Date().toISOString()
    };
  },
  normalizeItem() {
    return null;
  }
};

export const LISTING_ADAPTER_REGISTRY: Record<ListingProviderKey, ListingProviderAdapter<unknown>> = {
  placeholder: placeholderAdapter,
  naver_land: naverLandAdapter as unknown as ListingProviderAdapter<unknown>,
  zigbang: {
    ...placeholderAdapter,
    key: "zigbang"
  },
  dabang: {
    ...placeholderAdapter,
    key: "dabang"
  },
  kb_land: {
    ...placeholderAdapter,
    key: "kb_land"
  }
};

export function getListingAdapter(key: ListingProviderKey): ListingProviderAdapter<unknown> {
  return LISTING_ADAPTER_REGISTRY[key];
}

export function listListingAdapterKeys(): ListingProviderKey[] {
  return Object.keys(LISTING_ADAPTER_REGISTRY) as ListingProviderKey[];
}

export function normalizeListingsWithAdapter<TRaw>(
  adapter: ListingProviderAdapter<TRaw>,
  rawItems: TRaw[],
  ctx: ListingNormalizeContext
): ComplexListingItem[] {
  if (adapter.normalizeMany) return adapter.normalizeMany(rawItems, ctx);

  const normalized: ComplexListingItem[] = [];
  for (const raw of rawItems) {
    const item = adapter.normalizeItem(raw, ctx);
    if (item) normalized.push(item);
  }
  return normalized;
}
