import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getComplexDealsById } from "@/lib/complexes";
import { logApiError, recordApiMetric } from "@/lib/observability";

interface Context {
  params: Promise<{ id: string }>;
}

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(20)
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
      size: req.nextUrl.searchParams.get("size") ?? 20
    });

    const deals = await getComplexDealsById(complexId, query.page, query.size);
    return NextResponse.json({ ok: true, page: query.page, size: query.size, count: deals.length, deals });
  } catch (error) {
    logApiError("GET /api/complexes/:id/deals", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = message.includes("DATABASE_URL") ? 503 : 400;
    const code = status === 503 ? "DB_NOT_CONFIGURED" : "BAD_REQUEST";
    return NextResponse.json({ ok: false, code, error: message }, { status });
  } finally {
    recordApiMetric("GET /api/complexes/:id/deals", performance.now() - started, status);
  }
}

