import { NextRequest, NextResponse } from "next/server";
import { getRowhouseSummaryById } from "@/lib/rowhouses";
import { logApiError, recordApiMetric } from "@/lib/observability";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, context: Context) {
  const started = performance.now();
  let status = 200;

  try {
    const { id } = await context.params;
    const rowhouseId = Number(id);

    if (!Number.isInteger(rowhouseId) || rowhouseId <= 0) {
      status = 400;
      return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: "Invalid rowhouse id" }, { status });
    }

    const rowhouse = await getRowhouseSummaryById(rowhouseId);
    if (!rowhouse) {
      status = 404;
      return NextResponse.json({ ok: false, code: "NOT_FOUND", error: "Rowhouse not found" }, { status });
    }

    return NextResponse.json({ ok: true, rowhouse });
  } catch (error) {
    logApiError("GET /api/rowhouses/:id", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = message.includes("DATABASE_URL") ? 503 : 500;
    const code = status === 503 ? "DB_NOT_CONFIGURED" : "INTERNAL_ERROR";
    return NextResponse.json({ ok: false, code, error: message }, { status });
  } finally {
    recordApiMetric("GET /api/rowhouses/:id", performance.now() - started, status);
  }
}
