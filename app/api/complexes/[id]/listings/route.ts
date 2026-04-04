import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getComplexSummaryById } from "@/lib/complexes";
import {
  getListingAdapter,
  listListingAdapterKeys,
  normalizeListingsWithAdapter,
  type ListingProviderKey
} from "@/lib/listings/adapters";
import { logApiError, recordApiMetric } from "@/lib/observability";

interface Context {
  params: Promise<{ id: string }>;
}

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20),
  dealType: z.enum(["sale", "jeonse", "wolse", "all"]).default("all"),
  propertyType: z.enum(["apartment"]).default("apartment"),
  provider: z.enum(["placeholder", "naver_land", "zigbang", "dabang", "kb_land"]).default("placeholder"),
  fixture: z.enum(["sample"]).optional()
});

export async function GET(req: NextRequest, context: Context) {
  const started = performance.now();
  let status = 200;

  try {
    const { id } = await context.params;
    const complexId = Number(id);

    if (!Number.isInteger(complexId) || complexId <= 0) {
      status = 400;
      return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: "Invalid complex id" }, { status });
    }

    const query = querySchema.parse({
      page: req.nextUrl.searchParams.get("page") ?? 1,
      size: req.nextUrl.searchParams.get("size") ?? 20,
      dealType: req.nextUrl.searchParams.get("dealType") ?? "all",
      propertyType: req.nextUrl.searchParams.get("propertyType") ?? "apartment",
      provider: req.nextUrl.searchParams.get("provider") ?? "placeholder",
      fixture: req.nextUrl.searchParams.get("fixture") ?? undefined
    });

    const complex = await getComplexSummaryById(complexId);
    if (!complex) {
      status = 404;
      return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Complex not found" }, { status });
    }

    const providerKey = query.provider as ListingProviderKey;
    const adapter = getListingAdapter(providerKey);
    const fetched = await adapter.fetchRaw({
      complexId,
      page: query.page,
      size: query.size,
      dealType: query.dealType,
      propertyType: query.propertyType,
      fixture: query.fixture
    });

    const normalized = normalizeListingsWithAdapter(adapter, fetched.items, {
      complexId,
      dealType: query.dealType,
      propertyType: query.propertyType,
      nowIso: new Date().toISOString()
    });

    return NextResponse.json({
      ok: true,
      mode: providerKey === "placeholder" ? "placeholder" : "live",
      integrationStatus: providerKey === "placeholder" ? "pending" : "active",
      adapterContractVersion: adapter.version,
      adapterKey: adapter.key,
      availableAdapterKeys: listListingAdapterKeys(),
      complexId,
      page: query.page,
      size: query.size,
      totalCount: fetched.totalCount ?? normalized.length,
      count: normalized.length,
      listings: normalized,
      filters: {
        dealType: query.dealType,
        propertyType: query.propertyType
      },
      supportedDealTypes: ["sale", "jeonse", "wolse"],
      supportedPropertyTypes: ["apartment"],
      sourceLabel: fetched.sourceLabel ?? "매물 연동 준비중",
      updatedAt: fetched.updatedAt ?? new Date().toISOString(),
      message: "현재 단계에서는 실거래 중심 탐색에 집중합니다. 매물 연동은 트래픽 검증 후 진행합니다."
    });
  } catch (error) {
    logApiError("GET /api/complexes/:id/listings", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = message.includes("DATABASE_URL") ? 503 : 400;
    const code = status === 503 ? "DB_NOT_CONFIGURED" : "BAD_REQUEST";
    return NextResponse.json({ ok: false, code, error: message }, { status });
  } finally {
    recordApiMetric("GET /api/complexes/:id/listings", performance.now() - started, status);
  }
}
