"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomeMap from "@/components/HomeMap";
import LivabilitySummaryCard from "@/components/LivabilitySummaryCard";
import { trackEvent } from "@/lib/analytics";
import { hasStoredId, toggleStoredId } from "@/lib/clientPrefs";
import type { MapComplex } from "@/lib/types";

type SearchItem = {
  id: string;
  apt_name: string;
  legal_dong: string;
  region_code: string;
  region_name: string;
  build_year: number | null;
  total_units: number | null;
  locationQuality?: "exact" | "approx";
  locationSource?: "exact" | "approx";
  location_source?: "exact" | "approx";
  lat: number | null;
  lng: number | null;
  deal_amount_manwon: number | null;
  deal_date: string | null;
};

type Bounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

type HubKpi = {
  totalComplexes: number;
  deals3m: number;
  updatedAt: string | null;
  sourceLabel: string;
};

type TrendComplex = {
  id: string;
  aptName: string;
  legalDong: string;
  regionName: string;
  dealCount3m: number;
  latestDealDate: string | null;
  latestDealAmountManwon: number | null;
};

type RisingKeyword = {
  keyword: string;
  recentCount: number;
  previousCount: number;
  growthCount: number;
  growthRatePct: number | null;
};

type SnapshotDeal = {
  id: number;
  complexId: number;
  aptName: string;
  legalDong: string;
  regionCode: string;
  regionName: string;
  dealDate: string | null;
  dealAmountManwon: number | null;
  areaM2: number | null;
  floor: number | null;
};

type SnapshotSummary = {
  recentCount: number;
  previousCount: number;
  countDiff: number;
  recentMedianPriceManwon: number | null;
  previousMedianPriceManwon: number | null;
  medianPriceDiffManwon: number | null;
  medianPriceDiffPct: number | null;
};

type RecommendationItem = {
  id: string;
  aptName: string;
  legalDong: string;
  regionCode: string;
  regionName: string;
  dealAmountManwon: number | null;
  dealDate: string | null;
  dealCount3m: number;
  locationQuality: "exact" | "approx";
  reasonLabels: string[];
};

type SortValue = "latest" | "price_desc" | "price_asc" | "deal_count";
type DealType = "sale";
type PropertyType = "apartment";
type RightPanelTab = "results" | "selected" | "recommendations";

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "latest", label: "최신 거래순" },
  { value: "price_desc", label: "가격 높은순" },
  { value: "price_asc", label: "가격 낮은순" },
  { value: "deal_count", label: "최근 3개월 거래순" }
];

const DEAL_TYPE_OPTIONS = [
  { value: "sale", label: "매매", enabled: true },
  { value: "jeonse", label: "전세", enabled: false },
  { value: "wolse", label: "월세", enabled: false }
] as const;

const PROPERTY_TYPE_OPTIONS = [
  { value: "apartment", label: "아파트", enabled: true },
  { value: "officetel", label: "오피스텔", enabled: false },
  { value: "villa", label: "빌라", enabled: false },
  { value: "one_room", label: "원룸", enabled: false }
] as const;

const DEFAULT_BOUNDS: Bounds = {
  swLat: 37.0,
  swLng: 126.4,
  neLat: 37.8,
  neLng: 127.5
};

const MAX_DB_INT = 2_147_483_647;
const DEFAULT_SOURCE_LABEL = "국토교통부 실거래가 공개데이터";
const FAVORITE_KEY = "saljip:favorites:v1";

const KST_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
});

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

function sanitizePriceInput(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  const parsed = Number(digits);
  if (!Number.isFinite(parsed)) return "";
  return String(Math.min(MAX_DB_INT, Math.max(0, Math.trunc(parsed))));
}

function sanitizeIntInput(raw: string, max = MAX_DB_INT): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  const parsed = Number(digits);
  if (!Number.isFinite(parsed)) return "";
  return String(Math.min(max, Math.max(0, Math.trunc(parsed))));
}

function normalizeRegionCode(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 5);
  return /^\d{5}$/.test(digits) ? digits : "";
}

function formatManwon(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "-";
  const uk = Math.floor(value / 10000);
  const man = value % 10000;
  if (uk > 0 && man > 0) return `${uk}억 ${man.toLocaleString()}만원`;
  if (uk > 0) return `${uk}억원`;
  return `${value.toLocaleString()}만원`;
}

function formatKstDateTime(input: string | null): string {
  if (!input) return "-";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "-";
  return KST_DATE_TIME_FORMATTER.format(parsed);
}

function formatKstDate(input: string | null): string {
  if (!input) return "-";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "-";
  return KST_DATE_FORMATTER.format(parsed);
}

function sanitizeRegionName(raw?: string | null): string {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  if (/^\d{5}$/.test(value)) return "";
  if (/^지역\s*\d{5}$/.test(value)) return "";
  return value;
}

function formatRegionLabel(item: SearchItem): string {
  const regionParts = [sanitizeRegionName(item.region_name), item.legal_dong?.trim()].filter(Boolean);
  if (regionParts.length > 0) return regionParts.join(" ");
  return "지역 정보 없음";
}

function formatRegionText(regionName?: string | null, legalDong?: string | null): string {
  const regionParts = [sanitizeRegionName(regionName), legalDong?.trim()].filter(Boolean);
  return regionParts.length > 0 ? regionParts.join(" ") : "지역 정보 없음";
}

function formatCardTitle(item: SearchItem): string {
  const aptName = item.apt_name?.trim();
  if (aptName) return aptName;
  return `단지 #${item.id}`;
}

function getLocationQuality(item: SearchItem): "exact" | "approx" {
  return item.locationQuality ?? item.locationSource ?? item.location_source ?? "approx";
}

function formatGrowthLabel(item: RisingKeyword): string {
  const countLabel = `${item.growthCount >= 0 ? "+" : ""}${item.growthCount.toLocaleString()}건`;
  if (item.growthRatePct === null) return countLabel;
  const rateLabel = `${item.growthRatePct >= 0 ? "+" : ""}${item.growthRatePct.toFixed(1)}%`;
  return `${countLabel} (${rateLabel})`;
}

function formatSignedCount(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString()}건`;
}

function formatSignedPrice(value: number | null): string {
  if (value === null) return "-";
  const absText = formatManwon(Math.abs(value));
  return `${value >= 0 ? "+" : "-"}${absText}`;
}

function formatSignedPercent(value: number | null): string {
  if (value === null) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatBuildAge(buildYear: number | null | undefined): string {
  if (!buildYear || Number.isNaN(buildYear)) return "-";
  const age = new Date().getFullYear() - buildYear;
  if (!Number.isFinite(age)) return `${buildYear}년`;
  if (age < 0) return `${buildYear}년`;
  return `${age}년차 (${buildYear}년)`;
}

export default function Explorer() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxAgeYears, setMaxAgeYears] = useState("");
  const [minTotalUnits, setMinTotalUnits] = useState("");
  const [maxTotalUnits, setMaxTotalUnits] = useState("");

  const [sort, setSort] = useState<SortValue>("latest");
  const [dealType, setDealType] = useState<DealType>("sale");
  const [propertyType, setPropertyType] = useState<PropertyType>("apartment");
  const [exactOnly, setExactOnly] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("results");
  const [selectedComplexId, setSelectedComplexId] = useState<string | null>(null);
  const [bounds, setBounds] = useState<Bounds>(DEFAULT_BOUNDS);
  const [mapFitRequestKey, setMapFitRequestKey] = useState(0);
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [mapItems, setMapItems] = useState<MapComplex[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sourceLabel, setSourceLabel] = useState(DEFAULT_SOURCE_LABEL);
  const [hubKpi, setHubKpi] = useState<HubKpi>({
    totalComplexes: 0,
    deals3m: 0,
    updatedAt: null,
    sourceLabel: DEFAULT_SOURCE_LABEL
  });
  const [topComplexes, setTopComplexes] = useState<TrendComplex[]>([]);
  const [risingKeywords, setRisingKeywords] = useState<RisingKeyword[]>([]);
  const [snapshotDeals, setSnapshotDeals] = useState<SnapshotDeal[]>([]);
  const [snapshotSummary, setSnapshotSummary] = useState<SnapshotSummary>({
    recentCount: 0,
    previousCount: 0,
    countDiff: 0,
    recentMedianPriceManwon: null,
    previousMedianPriceManwon: null,
    medianPriceDiffManwon: null,
    medianPriceDiffPct: null
  });
  const [snapshotUpdatedAt, setSnapshotUpdatedAt] = useState<string | null>(null);
  const [snapshotSourceLabel, setSnapshotSourceLabel] = useState(DEFAULT_SOURCE_LABEL);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [recommendationUpdatedAt, setRecommendationUpdatedAt] = useState<string | null>(null);
  const [recommendationSourceLabel, setRecommendationSourceLabel] = useState(DEFAULT_SOURCE_LABEL);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [selectedFavorited, setSelectedFavorited] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const mapScopeSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQ(sp.get("q") ?? "");
    setRegion(sp.get("region") ?? "");
    setMinPrice(sp.get("min_price") ?? "");
    setMaxPrice(sp.get("max_price") ?? "");
    setMaxAgeYears(sp.get("max_age_years") ?? "");
    setMinTotalUnits(sp.get("min_total_units") ?? "");
    setMaxTotalUnits(sp.get("max_total_units") ?? "");

    const candidateSort = sp.get("sort");
    if (candidateSort && SORT_OPTIONS.some((s) => s.value === candidateSort)) {
      setSort(candidateSort as SortValue);
    }
    const candidateDealType = sp.get("deal_type");
    if (candidateDealType === "sale") setDealType("sale");
    const candidatePropertyType = sp.get("property_type");
    if (candidatePropertyType === "apartment") setPropertyType("apartment");

    const exactOnlyParam = sp.get("exact_only");
    setExactOnly(exactOnlyParam === "true");
    const swLat = Number(sp.get("sw_lat"));
    const swLng = Number(sp.get("sw_lng"));
    const neLat = Number(sp.get("ne_lat"));
    const neLng = Number(sp.get("ne_lng"));

    if (![swLat, swLng, neLat, neLng].some((v) => Number.isNaN(v))) {
      setBounds({ swLat, swLng, neLat, neLng });
    }

    setInitialized(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchKpi = async () => {
      setKpiLoading(true);
      try {
        const res = await fetch("/api/hub/kpi", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Hub KPI API failed");
        }
        if (cancelled) return;
        setHubKpi({
          totalComplexes: typeof json.kpi?.totalComplexes === "number" ? json.kpi.totalComplexes : 0,
          deals3m: typeof json.kpi?.deals3m === "number" ? json.kpi.deals3m : 0,
          updatedAt: json.updatedAt ?? null,
          sourceLabel:
            typeof json.sourceLabel === "string" && json.sourceLabel.trim() ? json.sourceLabel : DEFAULT_SOURCE_LABEL
        });
      } catch {
        if (cancelled) return;
        setHubKpi((prev) => ({
          ...prev,
          sourceLabel: DEFAULT_SOURCE_LABEL
        }));
      } finally {
        if (!cancelled) setKpiLoading(false);
      }
    };

    void fetchKpi();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchSnapshot = async () => {
      setSnapshotLoading(true);
      try {
        const res = await fetch("/api/hub/snapshot?limit=10", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Snapshot API failed");
        }
        if (cancelled) return;

        setSnapshotDeals(Array.isArray(json.snapshot?.recentDeals) ? json.snapshot.recentDeals : []);
        setSnapshotSummary({
          recentCount: Number(json.snapshot?.summary?.recentCount ?? 0),
          previousCount: Number(json.snapshot?.summary?.previousCount ?? 0),
          countDiff: Number(json.snapshot?.summary?.countDiff ?? 0),
          recentMedianPriceManwon:
            json.snapshot?.summary?.recentMedianPriceManwon === null
              ? null
              : Number(json.snapshot?.summary?.recentMedianPriceManwon),
          previousMedianPriceManwon:
            json.snapshot?.summary?.previousMedianPriceManwon === null
              ? null
              : Number(json.snapshot?.summary?.previousMedianPriceManwon),
          medianPriceDiffManwon:
            json.snapshot?.summary?.medianPriceDiffManwon === null
              ? null
              : Number(json.snapshot?.summary?.medianPriceDiffManwon),
          medianPriceDiffPct:
            json.snapshot?.summary?.medianPriceDiffPct === null
              ? null
              : Number(json.snapshot?.summary?.medianPriceDiffPct)
        });
        setSnapshotUpdatedAt(json.updatedAt ?? null);
        setSnapshotSourceLabel(
          typeof json.sourceLabel === "string" && json.sourceLabel.trim() ? json.sourceLabel : DEFAULT_SOURCE_LABEL
        );
      } catch {
        if (cancelled) return;
        setSnapshotDeals([]);
      } finally {
        if (!cancelled) setSnapshotLoading(false);
      }
    };

    void fetchSnapshot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchTrends = async () => {
      setTrendLoading(true);
      try {
        const res = await fetch("/api/hub/trends", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? "Trend API failed");
        }
        if (cancelled) return;

        setTopComplexes(Array.isArray(json.trends?.topComplexes) ? json.trends.topComplexes : []);
        setRisingKeywords(Array.isArray(json.trends?.risingKeywords) ? json.trends.risingKeywords : []);
      } catch {
        if (cancelled) return;
        setTopComplexes([]);
        setRisingKeywords([]);
      } finally {
        if (!cancelled) setTrendLoading(false);
      }
    };

    void fetchTrends();
    return () => {
      cancelled = true;
    };
  }, []);

  const queryState = useMemo(
    () => ({
      q: q.trim(),
      region: normalizeRegionCode(region),
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
      maxAgeYears: maxAgeYears.trim(),
      minTotalUnits: minTotalUnits.trim(),
      maxTotalUnits: maxTotalUnits.trim(),
      sort,
      dealType,
      propertyType,
      scope: "map" as const,
      exactOnly,
      bounds
    }),
    [q, region, minPrice, maxPrice, maxAgeYears, minTotalUnits, maxTotalUnits, sort, dealType, propertyType, exactOnly, bounds]
  );

  const syncUrl = useCallback(() => {
    const sp = new URLSearchParams();
    if (queryState.q) sp.set("q", queryState.q);
    if (queryState.region) sp.set("region", queryState.region);

    const normalizedMinPrice = sanitizePriceInput(queryState.minPrice);
    const normalizedMaxPrice = sanitizePriceInput(queryState.maxPrice);
    const normalizedMaxAgeYears = sanitizeIntInput(queryState.maxAgeYears, 100);
    const normalizedMinTotalUnits = sanitizeIntInput(queryState.minTotalUnits);
    const normalizedMaxTotalUnits = sanitizeIntInput(queryState.maxTotalUnits);
    if (normalizedMinPrice) sp.set("min_price", normalizedMinPrice);
    if (normalizedMaxPrice) sp.set("max_price", normalizedMaxPrice);
    if (normalizedMaxAgeYears) sp.set("max_age_years", normalizedMaxAgeYears);
    if (normalizedMinTotalUnits) sp.set("min_total_units", normalizedMinTotalUnits);
    if (normalizedMaxTotalUnits) sp.set("max_total_units", normalizedMaxTotalUnits);

    sp.set("sort", queryState.sort);
    sp.set("deal_type", queryState.dealType);
    sp.set("property_type", queryState.propertyType);
    sp.set("scope", queryState.scope);
    if (queryState.exactOnly) sp.set("exact_only", "true");
    sp.set("sw_lat", String(queryState.bounds.swLat));
    sp.set("sw_lng", String(queryState.bounds.swLng));
    sp.set("ne_lat", String(queryState.bounds.neLat));
    sp.set("ne_lng", String(queryState.bounds.neLng));
    router.replace(`/?${sp.toString()}`, { scroll: false });
  }, [queryState, router]);

  const fetchAll = useCallback(
    async ({ autoFit = false, manualSearch = false }: { autoFit?: boolean; manualSearch?: boolean } = {}) => {
    if (!queryState.q) {
      setSearchItems([]);
      setMapItems([]);
      setRecommendations([]);
      setUpdatedAt(null);
      setRecommendationUpdatedAt(null);
      setTotalCount(0);
      setSourceLabel(DEFAULT_SOURCE_LABEL);
      setRecommendationSourceLabel(DEFAULT_SOURCE_LABEL);
      setRecommendationLoading(false);
      syncUrl();
      return;
    }

    setLoading(true);
    setRecommendationLoading(true);
    setError("");

      try {
      const common = new URLSearchParams();
      common.set("q", queryState.q);
      common.set("page", "1");
      common.set("size", "20");
      common.set("sort", queryState.sort);
      common.set("deal_type", queryState.dealType);
      common.set("property_type", queryState.propertyType);
      common.set("scope", queryState.scope);
      common.set("exact_only", String(queryState.exactOnly));
      if (!manualSearch) {
        common.set("sw_lat", String(queryState.bounds.swLat));
        common.set("sw_lng", String(queryState.bounds.swLng));
        common.set("ne_lat", String(queryState.bounds.neLat));
        common.set("ne_lng", String(queryState.bounds.neLng));
      }
      if (queryState.region) common.set("region", queryState.region);

      const normalizedMinPrice = sanitizePriceInput(queryState.minPrice);
      const normalizedMaxPrice = sanitizePriceInput(queryState.maxPrice);
      const normalizedMaxAgeYears = sanitizeIntInput(queryState.maxAgeYears, 100);
      const normalizedMinTotalUnits = sanitizeIntInput(queryState.minTotalUnits);
      const normalizedMaxTotalUnits = sanitizeIntInput(queryState.maxTotalUnits);
      if (normalizedMinPrice) common.set("min_price", normalizedMinPrice);
      if (normalizedMaxPrice) common.set("max_price", normalizedMaxPrice);
      if (normalizedMaxAgeYears) common.set("max_age_years", normalizedMaxAgeYears);
      if (normalizedMinTotalUnits) common.set("min_total_units", normalizedMinTotalUnits);
      if (normalizedMaxTotalUnits) common.set("max_total_units", normalizedMaxTotalUnits);

      const recommendationQuery = new URLSearchParams();
      recommendationQuery.set("q", queryState.q);
      recommendationQuery.set("deal_type", queryState.dealType);
      recommendationQuery.set("property_type", queryState.propertyType);
      recommendationQuery.set("scope", queryState.scope);
      recommendationQuery.set("exact_only", String(queryState.exactOnly));
      if (!manualSearch) {
        recommendationQuery.set("sw_lat", String(queryState.bounds.swLat));
        recommendationQuery.set("sw_lng", String(queryState.bounds.swLng));
        recommendationQuery.set("ne_lat", String(queryState.bounds.neLat));
        recommendationQuery.set("ne_lng", String(queryState.bounds.neLng));
      }
      recommendationQuery.set("limit", "8");
      if (queryState.region) recommendationQuery.set("region", queryState.region);
      if (normalizedMinPrice) recommendationQuery.set("min_price", normalizedMinPrice);
      if (normalizedMaxPrice) recommendationQuery.set("max_price", normalizedMaxPrice);

      const searchResPromise = fetch(`/api/search?${common.toString()}`, { cache: "no-store" });
      const recommendationResPromise = fetch(`/api/hub/recommendations?${recommendationQuery.toString()}`, {
        cache: "no-store"
      });

      const mapResPromise = manualSearch
        ? Promise.resolve(null)
        : (() => {
            const mapQuery = new URLSearchParams(common);
            mapQuery.set("sw_lat", String(queryState.bounds.swLat));
            mapQuery.set("sw_lng", String(queryState.bounds.swLng));
            mapQuery.set("ne_lat", String(queryState.bounds.neLat));
            mapQuery.set("ne_lng", String(queryState.bounds.neLng));
            mapQuery.set("limit", "300");
            return fetch(`/api/map/complexes?${mapQuery.toString()}`, { cache: "no-store" });
          })();

      const [searchRes, mapRes, recommendationRes] = await Promise.all([searchResPromise, mapResPromise, recommendationResPromise]);

      const searchJson = await searchRes.json();
      const mapJson = mapRes ? await mapRes.json() : null;
      const recommendationJson = await recommendationRes.json();

      if (!searchRes.ok || !searchJson.ok) throw new Error(searchJson.error ?? "Search API failed");
      if (mapRes && (!mapRes.ok || !mapJson?.ok)) throw new Error(mapJson?.error ?? "Map API failed");

      setSearchItems(searchJson.items ?? []);
      let currentMapItems: MapComplex[] = [];
      if (manualSearch) {
        const mappedFromSearch: MapComplex[] = (Array.isArray(searchJson.items) ? searchJson.items : [])
          .filter((item: SearchItem) => typeof item.lat === "number" && typeof item.lng === "number")
          .slice(0, 300)
          .map((item: SearchItem) => ({
            id: Number(item.id),
            aptId: `search-${item.id}`,
            aptName: item.apt_name ?? `단지 #${item.id}`,
            legalDong: item.legal_dong ?? "",
            dealAmount: Number(item.deal_amount_manwon ?? 0),
            dealDate: item.deal_date ?? null,
            dealCount3m: undefined,
            regionCode: item.region_code ?? undefined,
            regionName: item.region_name ?? undefined,
            buildYear: item.build_year ?? null,
            totalUnits: item.total_units ?? null,
            lat: Number(item.lat),
            lng: Number(item.lng),
            locationQuality: getLocationQuality(item),
            locationSource: getLocationQuality(item)
          }));
        currentMapItems = mappedFromSearch;
        setMapItems(currentMapItems);
      } else {
        currentMapItems = mapJson?.complexes ?? [];
        setMapItems(currentMapItems);
      }
      setUpdatedAt(searchJson.updatedAt ?? null);
      setTotalCount(typeof searchJson.totalCount === "number" ? searchJson.totalCount : (searchJson.items ?? []).length);
      setSourceLabel(typeof searchJson.sourceLabel === "string" && searchJson.sourceLabel.trim() ? searchJson.sourceLabel : DEFAULT_SOURCE_LABEL);

      if (recommendationRes.ok && recommendationJson.ok) {
        setRecommendations(Array.isArray(recommendationJson.recommendations) ? recommendationJson.recommendations : []);
        setRecommendationUpdatedAt(recommendationJson.updatedAt ?? null);
        setRecommendationSourceLabel(
          typeof recommendationJson.sourceLabel === "string" && recommendationJson.sourceLabel.trim()
            ? recommendationJson.sourceLabel
            : DEFAULT_SOURCE_LABEL
        );
      } else {
        setRecommendations([]);
        setRecommendationUpdatedAt(null);
        setRecommendationSourceLabel(DEFAULT_SOURCE_LABEL);
      }

      trackEvent("view_search_results", {
        search_term: queryState.q,
        region_code: queryState.region || undefined,
        results_count: Array.isArray(searchJson.items) ? searchJson.items.length : 0,
        deal_type: queryState.dealType,
        property_type: queryState.propertyType,
        max_age_years: queryState.maxAgeYears || undefined,
        min_total_units: queryState.minTotalUnits || undefined,
        max_total_units: queryState.maxTotalUnits || undefined,
        search_scope: queryState.scope,
        exact_only: queryState.exactOnly,
        sort: queryState.sort
      });
      if (autoFit && currentMapItems.length > 0) {
        setMapFitRequestKey((prev) => prev + 1);
      }
      syncUrl();
      } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setSearchItems([]);
      setMapItems([]);
      setRecommendations([]);
      setTotalCount(0);
      } finally {
      setLoading(false);
      setRecommendationLoading(false);
      }
    },
    [queryState, syncUrl]
  );

  const onMapBoundsChanged = useCallback((next: Bounds) => {
    setBounds(next);
  }, []);

  useEffect(() => {
    if (!initialized || bootstrapped) return;
    void fetchAll({ autoFit: true });
    setBootstrapped(true);
  }, [initialized, bootstrapped, fetchAll]);

  useEffect(() => {
    if (!initialized || !bootstrapped) return;
    if (!q.trim()) return;

    if (mapScopeSearchTimerRef.current) {
      clearTimeout(mapScopeSearchTimerRef.current);
    }

    mapScopeSearchTimerRef.current = setTimeout(() => {
      setRightPanelTab("results");
      void fetchAll();
    }, 450);

    return () => {
      if (mapScopeSearchTimerRef.current) {
        clearTimeout(mapScopeSearchTimerRef.current);
        mapScopeSearchTimerRef.current = null;
      }
    };
  }, [initialized, bootstrapped, q, bounds, fetchAll]);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setRightPanelTab("results");
    await fetchAll({ autoFit: true, manualSearch: true });
  };

  const resetFilters = () => {
    setQ("");
    setRegion("");
    setMinPrice("");
    setMaxPrice("");
    setMaxAgeYears("");
    setMinTotalUnits("");
    setMaxTotalUnits("");

    setSort("latest");
    setDealType("sale");
    setPropertyType("apartment");
    setExactOnly(false);
    setRightPanelTab("results");
    setSearchItems([]);
    setMapItems([]);
    setRecommendations([]);
    setUpdatedAt(null);
    setRecommendationUpdatedAt(null);
    setTotalCount(0);
    setSourceLabel(DEFAULT_SOURCE_LABEL);
    setRecommendationSourceLabel(DEFAULT_SOURCE_LABEL);
    router.replace("/", { scroll: false });
  };

  const hubLivabilityTarget = useMemo(() => {
    if (!queryState.q) return null;
    const firstSearch = searchItems[0];
    if (firstSearch?.id) {
      const id = Number(firstSearch.id);
      if (Number.isInteger(id) && id > 0) {
        return {
          complexId: id,
          title: `${formatCardTitle(firstSearch)} · 생활 인프라 요약`
        };
      }
    }

    const firstRecommendation = recommendations[0];
    if (firstRecommendation?.id) {
      const id = Number(firstRecommendation.id);
      if (Number.isInteger(id) && id > 0) {
        return {
          complexId: id,
          title: `${firstRecommendation.aptName || `단지 #${firstRecommendation.id}`} · 생활 인프라 요약`
        };
      }
    }

    return null;
  }, [queryState.q, recommendations, searchItems]);

  useEffect(() => {
    if (searchItems.length === 0) {
      setSelectedComplexId(null);
      return;
    }
    if (!selectedComplexId || !searchItems.some((item) => item.id === selectedComplexId)) {
      setSelectedComplexId(searchItems[0].id);
    }
  }, [searchItems, selectedComplexId]);

  const selectedSearchItem = useMemo(() => {
    if (!selectedComplexId) return null;
    return searchItems.find((item) => item.id === selectedComplexId) ?? null;
  }, [searchItems, selectedComplexId]);

  const selectedMapItem = useMemo(() => {
    if (!selectedComplexId) return null;
    return mapItems.find((item) => String(item.id) === selectedComplexId) ?? null;
  }, [mapItems, selectedComplexId]);

  const selectedPreview = useMemo(() => {
    if (selectedSearchItem) {
      return {
        id: selectedSearchItem.id,
        aptName: formatCardTitle(selectedSearchItem),
        regionLabel: formatRegionLabel(selectedSearchItem),
        dealAmount: selectedSearchItem.deal_amount_manwon,
        dealDate: selectedSearchItem.deal_date,
        dealCount3m: null,
        buildYear: selectedSearchItem.build_year,
        totalUnits: selectedSearchItem.total_units,
        locationQuality: getLocationQuality(selectedSearchItem)
      };
    }

    if (selectedMapItem) {
      return {
        id: String(selectedMapItem.id),
        aptName: selectedMapItem.aptName,
        regionLabel: formatRegionText(selectedMapItem.regionName, selectedMapItem.legalDong),
        dealAmount: selectedMapItem.dealAmount || null,
        dealDate: selectedMapItem.dealDate ?? null,
        dealCount3m: selectedMapItem.dealCount3m ?? null,
        buildYear: selectedMapItem.buildYear ?? null,
        totalUnits: selectedMapItem.totalUnits ?? null,
        locationQuality: selectedMapItem.locationQuality ?? selectedMapItem.locationSource ?? "approx"
      };
    }

    return null;
  }, [selectedMapItem, selectedSearchItem]);

  useEffect(() => {
    if (!selectedPreview) {
      setSelectedFavorited(false);
      return;
    }

    const numericId = Number(selectedPreview.id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setSelectedFavorited(false);
      return;
    }

    setSelectedFavorited(hasStoredId(FAVORITE_KEY, numericId));
  }, [selectedPreview]);

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px", display: "grid", gap: 14 }}>
      <header>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>살집</h1>
        <p style={{ color: "#475569" }}>서울·수도권 아파트 실거래가·시세를 지도에서 검색하세요</p>
      </header>

      <section className="hub-phasea-section" aria-label="거래 유형과 매물 유형">
        <div className="hub-chip-row">
          <span className="hub-chip-label">거래 유형</span>
          {DEAL_TYPE_OPTIONS.filter((option) => option.enabled).map((option) => (
            <button
              key={option.value}
              type="button"
              className={`hub-chip-button ${dealType === "sale" && option.value === "sale" ? "hub-chip-active" : ""}`}
              disabled={!option.enabled}
              onClick={() => {
                if (option.value === "sale") setDealType("sale");
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="hub-chip-row">
          <span className="hub-chip-label">매물 유형</span>
          {PROPERTY_TYPE_OPTIONS.filter((option) => option.enabled).map((option) => (
            <button
              key={option.value}
              type="button"
              className={`hub-chip-button ${
                propertyType === "apartment" && option.value === "apartment" ? "hub-chip-active" : ""
              }`}
              disabled={!option.enabled}
              onClick={() => {
                if (option.value === "apartment") setPropertyType("apartment");
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={runSearch} className="explorer-filter-grid">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="단지/브랜드/동 검색 (예: 래미안, 대치동)"
          className="ui-input"
          aria-label="검색어"
        />
        <input
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          onBlur={(e) => setMinPrice(sanitizePriceInput(e.target.value))}
          placeholder="최소가(만원, 숫자만)"
          className="ui-input"
          inputMode="numeric"
          aria-label="최소가"
        />
        <input
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          onBlur={(e) => setMaxPrice(sanitizePriceInput(e.target.value))}
          placeholder="최대가(만원, 숫자만)"
          className="ui-input"
          inputMode="numeric"
          aria-label="최대가"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortValue)} className="ui-input" aria-label="정렬">
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" className="ui-button" disabled={loading}>
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          className={`ui-button ${filterDrawerOpen ? "" : "hub-button-muted"}`}
          onClick={() => setFilterDrawerOpen((prev) => !prev)}
        >
          {filterDrawerOpen ? "필터 닫기" : "필터 열기"}
        </button>
      </div>

      {filterDrawerOpen && (
        <section className="hub-filter-drawer" aria-label="확장 필터">
          <div className="hub-filter-grid">
            <label className="hub-filter-item">
              입주연차 최대
              <input
                value={maxAgeYears}
                onChange={(e) => setMaxAgeYears(e.target.value)}
                onBlur={(e) => setMaxAgeYears(sanitizeIntInput(e.target.value, 100))}
                placeholder="예: 15 (년차 이하)"
                className="ui-input"
                inputMode="numeric"
              />
            </label>

            <label className="hub-filter-item">
              세대수 최소
              <input
                value={minTotalUnits}
                onChange={(e) => setMinTotalUnits(e.target.value)}
                onBlur={(e) => setMinTotalUnits(sanitizeIntInput(e.target.value))}
                placeholder="예: 500"
                className="ui-input"
                inputMode="numeric"
              />
            </label>

            <label className="hub-filter-item">
              세대수 최대
              <input
                value={maxTotalUnits}
                onChange={(e) => setMaxTotalUnits(e.target.value)}
                onBlur={(e) => setMaxTotalUnits(sanitizeIntInput(e.target.value))}
                placeholder="예: 3000"
                className="ui-input"
                inputMode="numeric"
              />
            </label>


            <label
              className="hub-filter-item"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
            >
              정확 좌표만 보기
              <input type="checkbox" checked={exactOnly} onChange={(e) => setExactOnly(e.target.checked)} />
            </label>
          </div>
        </section>
      )}

      {error && <div className="ui-error">오류: {error}</div>}

      <section className="explorer-grid">
        <div>
          <HomeMap
            complexes={mapItems}
            onBoundsChanged={onMapBoundsChanged}
            fitRequestKey={mapFitRequestKey}
            onMarkerSelected={(complex) => {
              router.push(`/complexes/${complex.id}`);
            }}
          />
        </div>
        <aside className="hub-right-panel">
          <div className="hub-right-panel-shell">
            <div className="hub-right-panel-tabs" role="tablist" aria-label="우측 패널 탭">
              <button
                type="button"
                className={`hub-right-tab ${rightPanelTab === "results" ? "hub-right-tab-active" : ""}`}
                onClick={() => setRightPanelTab("results")}
              >
                검색 결과
              </button>
              <button
                type="button"
                className={`hub-right-tab ${rightPanelTab === "selected" ? "hub-right-tab-active" : ""}`}
                onClick={() => setRightPanelTab("selected")}
              >
                선택 단지
              </button>
              <button
                type="button"
                className={`hub-right-tab ${rightPanelTab === "recommendations" ? "hub-right-tab-active" : ""}`}
                onClick={() => setRightPanelTab("recommendations")}
              >
                추천
              </button>
            </div>

            <div className="hub-right-panel-body">
              {rightPanelTab === "results" && (
                <>
                  {!loading && !error && searchItems.length === 0 && (
                    <div
                      style={{
                        color: "#64748b",
                        border: "1px dashed #cbd5e1",
                        borderRadius: 10,
                        padding: 12,
                        display: "grid",
                        gap: 10
                      }}
                    >
                      <span>조건에 맞는 단지가 없습니다.</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" className="ui-button" onClick={resetFilters}>
                          조건 초기화
                        </button>
                      </div>
                    </div>
                  )}

                  {searchItems.map((item) => {
                    const isSelected = selectedComplexId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`hub-panel-item ${isSelected ? "hub-panel-item-selected" : ""}`}
                        onClick={() => {
                          setSelectedComplexId(item.id);
                          setRightPanelTab("selected");
                        }}
                      >
                        <div style={{ textAlign: "left" }}>
                          <p style={{ fontWeight: 700 }}>{formatCardTitle(item)}</p>
                          <p style={{ color: "#64748b", fontSize: 13 }}>{formatRegionLabel(item)}</p>
                          {getLocationQuality(item) === "approx" && <span className="ui-approx-badge">근사 위치</span>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontWeight: 700 }}>{formatManwon(item.deal_amount_manwon)}</p>
                          <p className="hub-trend-meta">{formatKstDate(item.deal_date)}</p>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              {rightPanelTab === "selected" && (
                <>
                  {!selectedPreview && (
                    <p style={{ color: "#64748b", fontSize: 14 }}>검색 결과 또는 지도에서 단지를 선택해 주세요.</p>
                  )}
                  {selectedPreview && (
                    <article className="hub-selected-card">
                      <div style={{ display: "grid", gap: 6 }}>
                        <p style={{ fontWeight: 800, fontSize: 18 }}>{selectedPreview.aptName}</p>
                        <p style={{ color: "#64748b", fontSize: 13 }}>{selectedPreview.regionLabel}</p>
                        {selectedPreview.locationQuality === "approx" && <span className="ui-approx-badge">근사 위치</span>}
                      </div>

                      <div className="hub-selected-metrics">
                        <div className="hub-selected-metric">
                          <p className="hub-trend-meta">최근 거래가</p>
                          <p style={{ fontWeight: 800 }}>{formatManwon(selectedPreview.dealAmount)}</p>
                        </div>
                        <div className="hub-selected-metric">
                          <p className="hub-trend-meta">최근 거래일</p>
                          <p style={{ fontWeight: 800 }}>{formatKstDate(selectedPreview.dealDate)}</p>
                        </div>
                        <div className="hub-selected-metric">
                          <p className="hub-trend-meta">입주연차</p>
                          <p style={{ fontWeight: 800 }}>{formatBuildAge(selectedPreview.buildYear)}</p>
                        </div>
                        <div className="hub-selected-metric">
                          <p className="hub-trend-meta">세대수</p>
                          <p style={{ fontWeight: 800 }}>
                            {selectedPreview.totalUnits ? `${selectedPreview.totalUnits.toLocaleString()}세대` : "-"}
                          </p>
                        </div>
                        <div className="hub-selected-metric">
                          <p className="hub-trend-meta">최근 3개월 거래</p>
                          <p style={{ fontWeight: 800 }}>
                            {selectedPreview.dealCount3m === null ? "-" : `${selectedPreview.dealCount3m.toLocaleString()}건`}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="ui-button"
                          onClick={() => {
                            const numericId = Number(selectedPreview.id);
                            if (!Number.isInteger(numericId) || numericId <= 0) return;
                            const next = toggleStoredId(FAVORITE_KEY, numericId);
                            setSelectedFavorited(next);
                            trackEvent("cta_click", {
                              action: next ? "favorite" : "unfavorite",
                              complex_id: numericId,
                              source: "hub_selected_panel"
                            });
                          }}
                        >
                          {selectedFavorited ? "관심해제" : "관심등록"}
                        </button>
                        <Link href={`/complexes/${selectedPreview.id}`} className="ui-button">
                          단지 상세 보기
                        </Link>
                      </div>
                    </article>
                  )}
                </>
              )}

              {rightPanelTab === "recommendations" && (
                <>
                  {!recommendationLoading && recommendations.length === 0 && (
                    <p style={{ color: "#64748b", fontSize: 14 }}>표시할 추천 단지가 없습니다.</p>
                  )}
                  {recommendationLoading && <p style={{ color: "#64748b", fontSize: 14 }}>불러오는 중...</p>}
                  {!recommendationLoading &&
                    recommendations.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="hub-panel-item"
                        onClick={() => {
                          setSelectedComplexId(item.id);
                          setRightPanelTab("selected");
                        }}
                      >
                        <div style={{ textAlign: "left" }}>
                          <p className="hub-text-ellipsis-2" style={{ fontWeight: 700 }}>
                            {item.aptName || `단지 #${item.id}`}
                          </p>
                          <p className="hub-trend-meta">
                            {formatRegionText(item.regionName, item.legalDong)}
                          </p>
                          <div className="hub-recommendation-tags">
                            {item.reasonLabels.slice(0, 2).map((label) => (
                              <span key={`${item.id}-${label}`} className="hub-recommendation-tag">
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontWeight: 700 }}>{formatManwon(item.dealAmountManwon)}</p>
                          <p className="hub-trend-meta">{formatKstDate(item.dealDate)}</p>
                        </div>
                      </button>
                    ))}
                </>
              )}
            </div>
          </div>
        </aside>
      </section>

      <p style={{ color: "#64748b", fontSize: 12 }}>
        출처: {sourceLabel} · 업데이트: {formatKstDateTime(updatedAt)} · 리스트 {totalCount.toLocaleString()}건 · 지도{" "}
        {mapItems.length.toLocaleString()}건
      </p>

      <section className="hub-kpi-grid" aria-label="허브 KPI">
        <article className="hub-kpi-card">
          <p className="hub-kpi-label">전체 단지 수</p>
          <p className="hub-kpi-value">{kpiLoading ? "-" : `${hubKpi.totalComplexes.toLocaleString()}건`}</p>
        </article>
        <article className="hub-kpi-card">
          <p className="hub-kpi-label">최근 3개월 거래 수</p>
          <p className="hub-kpi-value">{kpiLoading ? "-" : `${hubKpi.deals3m.toLocaleString()}건`}</p>
        </article>
      </section>

      <p style={{ color: "#64748b", fontSize: 13 }}>
        KPI 기준: {hubKpi.sourceLabel} · 업데이트 {formatKstDateTime(hubKpi.updatedAt)}
      </p>

      <section className="hub-trend-grid" aria-label="허브 트렌드">
        <article className="hub-trend-card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>인기 단지 (최근 3개월 거래)</h2>
          {trendLoading && <p style={{ color: "#64748b", fontSize: 14 }}>불러오는 중...</p>}
          {!trendLoading && topComplexes.length === 0 && (
            <p style={{ color: "#64748b", fontSize: 14 }}>표시할 단지가 없습니다.</p>
          )}
          {!trendLoading && topComplexes.length > 0 && (
            <div className="hub-trend-list">
              {topComplexes.map((item) => (
                <Link key={item.id} href={`/complexes/${item.id}`} className="hub-trend-item">
                  <div>
                    <p style={{ fontWeight: 700 }}>{item.aptName}</p>
                    <p className="hub-trend-meta">
                      {formatRegionText(item.regionName, item.legalDong)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 700 }}>{item.dealCount3m.toLocaleString()}건</p>
                    <p className="hub-trend-meta">{formatManwon(item.latestDealAmountManwon)}</p>
                    <p className="hub-trend-meta">{formatKstDate(item.latestDealDate)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="hub-trend-card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>급상승 키워드 (최근 30일)</h2>
          {trendLoading && <p style={{ color: "#64748b", fontSize: 14 }}>불러오는 중...</p>}
          {!trendLoading && risingKeywords.length === 0 && (
            <p style={{ color: "#64748b", fontSize: 14 }}>표시할 키워드가 없습니다.</p>
          )}
          {!trendLoading && risingKeywords.length > 0 && (
            <ul className="hub-trend-list">
              {risingKeywords.map((item) => (
                <li key={item.keyword} className="hub-trend-item">
                  <div>
                    <p style={{ fontWeight: 700 }}>{item.keyword}</p>
                    <p className="hub-trend-meta">
                      최근 {item.recentCount.toLocaleString()}건 · 직전 {item.previousCount.toLocaleString()}건
                    </p>
                  </div>
                  <span className="hub-keyword-growth">{formatGrowthLabel(item)}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="hub-snapshot-grid" aria-label="최근 거래 스냅샷">
        <article className="hub-snapshot-card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>최근 가격 변화 요약 (30일 비교)</h2>
          {snapshotLoading && <p style={{ color: "#64748b", fontSize: 14 }}>불러오는 중...</p>}
          {!snapshotLoading && (
            <div className="hub-snapshot-summary-grid">
              <div className="hub-snapshot-summary-item">
                <p className="hub-trend-meta">최근 30일 거래</p>
                <p style={{ fontWeight: 800, fontSize: 20 }}>{snapshotSummary.recentCount.toLocaleString()}건</p>
                <p className="hub-trend-meta">직전 30일 {snapshotSummary.previousCount.toLocaleString()}건</p>
                <p className="hub-snapshot-diff">{formatSignedCount(snapshotSummary.countDiff)}</p>
              </div>
              <div className="hub-snapshot-summary-item">
                <p className="hub-trend-meta">최근 30일 중위 거래가</p>
                <p style={{ fontWeight: 800, fontSize: 20 }}>{formatManwon(snapshotSummary.recentMedianPriceManwon)}</p>
                <p className="hub-trend-meta">직전 30일 {formatManwon(snapshotSummary.previousMedianPriceManwon)}</p>
                <p className="hub-snapshot-diff">
                  {formatSignedPrice(snapshotSummary.medianPriceDiffManwon)} ·{" "}
                  {formatSignedPercent(snapshotSummary.medianPriceDiffPct)}
                </p>
              </div>
            </div>
          )}
          <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
            기준: {snapshotSourceLabel} · 업데이트 {formatKstDateTime(snapshotUpdatedAt)}
          </p>
        </article>

        <article className="hub-snapshot-card">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>최근 거래 10건</h2>
          {snapshotLoading && <p style={{ color: "#64748b", fontSize: 14 }}>불러오는 중...</p>}
          {!snapshotLoading && snapshotDeals.length === 0 && (
            <p style={{ color: "#64748b", fontSize: 14 }}>표시할 거래 데이터가 없습니다.</p>
          )}
          {!snapshotLoading && snapshotDeals.length > 0 && (
            <div className="hub-trend-list">
              {snapshotDeals.map((deal) => (
                <Link key={deal.id} href={`/complexes/${deal.complexId}`} className="hub-trend-item">
                  <div>
                    <p style={{ fontWeight: 700 }}>{deal.aptName}</p>
                    <p className="hub-trend-meta">
                      {formatRegionText(deal.regionName, deal.legalDong)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 700 }}>{formatManwon(deal.dealAmountManwon)}</p>
                    <p className="hub-trend-meta">{formatKstDate(deal.dealDate)}</p>
                    <p className="hub-trend-meta">
                      {deal.areaM2 ? `${deal.areaM2.toLocaleString()}m²` : "-"}
                      {deal.floor ? ` · ${deal.floor}층` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>

      {hubLivabilityTarget ? (
        <LivabilitySummaryCard
          complexId={hubLivabilityTarget.complexId}
          title="생활 인프라 요약"
          subtitle={hubLivabilityTarget.title}
        />
      ) : (
        <section className="hub-livability-card" aria-label="생활 인프라 요약">
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>생활 인프라 요약</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            검색 결과가 있을 때 선택 단지 기준 생활 인프라 요약이 표시됩니다.
          </p>
        </section>
      )}

      <section className="hub-recommendation-card" aria-label="조건 기반 추천">
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>조건 기반 추천</h2>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 10 }}>
          현재 검색 조건과 유사한 단지입니다.
        </p>

        {recommendationLoading && <p style={{ color: "#64748b", fontSize: 14 }}>불러오는 중...</p>}
        {!recommendationLoading && recommendations.length === 0 && (
          <p style={{ color: "#64748b", fontSize: 14 }}>표시할 추천 단지가 없습니다.</p>
        )}

        {!recommendationLoading && recommendations.length > 0 && (
          <div className="hub-trend-list">
            {recommendations.map((item) => (
              <Link key={item.id} href={`/complexes/${item.id}`} className="hub-trend-item">
                <div>
                  <p className="hub-text-ellipsis-2" style={{ fontWeight: 700 }}>
                    {item.aptName || `단지 #${item.id}`}
                  </p>
                  <p className="hub-trend-meta">
                    {formatRegionText(item.regionName, item.legalDong)}
                  </p>
                  <div className="hub-recommendation-tags">
                    {item.reasonLabels.slice(0, 2).map((label) => (
                      <span key={`${item.id}-${label}`} className="hub-recommendation-tag">
                        {label}
                      </span>
                    ))}
                    {item.locationQuality === "approx" && <span className="ui-approx-badge">근사 위치</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 700 }}>{formatManwon(item.dealAmountManwon)}</p>
                  <p className="hub-trend-meta">{formatKstDate(item.dealDate)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

      <p style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>
          기준: {recommendationSourceLabel} · 업데이트 {formatKstDateTime(recommendationUpdatedAt)}
        </p>
      </section>
    </main>
  );
}

