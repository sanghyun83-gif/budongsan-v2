import { NextRequest, NextResponse } from "next/server";
import { getComplexSummaryById } from "@/lib/complexes";
import { logApiError, recordApiMetric } from "@/lib/observability";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, context: Context) {
  const started = performance.now();
  let status = 200;

  try {
    const { id } = await context.params;
    const complexId = Number(id);

    if (!Number.isInteger(complexId) || complexId <= 0) {
      status = 400;
      return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: "Invalid complex id" }, { status });
    }

    const complex = await getComplexSummaryById(complexId);
    if (!complex) {
      status = 404;
      return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Complex not found" }, { status });
    }

    return NextResponse.json({ ok: true, complex });
  } catch (error) {
    logApiError("GET /api/complexes/:id", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = message.includes("DATABASE_URL") ? 503 : 500;
    const code = status === 503 ? "DB_NOT_CONFIGURED" : "INTERNAL_ERROR";
    return NextResponse.json({ ok: false, code, error: message }, { status });
  } finally {
    recordApiMetric("GET /api/complexes/:id", performance.now() - started, status);
  }
}

