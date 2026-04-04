export interface ApartmentDeal {
  aptId: string;
  regionCode: string;
  aptName: string;
  legalDong: string;
  dealAmount: number; // KRW 만원 unit from data.go.kr
  dealYear: number;
  dealMonth: number;
  dealDay: number;
  areaM2: number;
  floor: number;
  buildYear: number;
}

export interface Sigungu {
  code: string;
  sido: "seoul" | "gyeonggi";
  slug: string;
  nameKo: string;
}

export type LocationQuality = "exact" | "approx";
// Legacy alias kept for compatibility during migration.
export type LocationSource = LocationQuality;

export interface MapComplex {
  id: number;
  aptId: string;
  aptName: string;
  legalDong: string;
  dealAmount: number;
  dealDate?: string | null;
  dealCount3m?: number;
  regionCode?: string;
  regionName?: string;
  buildYear?: number | null;
  totalUnits?: number | null;
  lat: number;
  lng: number;
  locationQuality: LocationQuality;
  locationSource?: LocationSource;
}

export type ListingDealType = "sale" | "jeonse" | "wolse";

export interface ComplexListingItem {
  id: string;
  dealType: ListingDealType;
  priceManwon: number | null;
  depositManwon: number | null;
  monthlyRentManwon: number | null;
  areaM2: number | null;
  floor: number | null;
  sourceName: string | null;
  listedAt: string | null;
  url: string | null;
}

export interface ComplexListingsResponse {
  ok: boolean;
  mode: "placeholder" | "fixture" | "live";
  integrationStatus: "pending" | "active" | "error";
  adapterContractVersion?: "v1";
  adapterKey?: "placeholder" | "naver_land" | "zigbang" | "dabang" | "kb_land";
  availableAdapterKeys?: Array<"placeholder" | "naver_land" | "zigbang" | "dabang" | "kb_land">;
  complexId: number;
  page: number;
  size: number;
  totalCount: number;
  count: number;
  listings: ComplexListingItem[];
  filters: {
    dealType: ListingDealType | "all";
    propertyType: "apartment";
  };
  supportedDealTypes: ListingDealType[];
  supportedPropertyTypes: Array<"apartment">;
  sourceLabel: string;
  updatedAt: string;
  message: string;
}
