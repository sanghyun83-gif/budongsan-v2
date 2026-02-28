import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool, hasDatabaseUrl } from "@/lib/db";
import { logApiError, recordApiMetric } from "@/lib/observability";

const bodySchema = z.object({
  action: z.enum(["favorite", "alert", "inquiry"]),
  complexId: z.number().int().positive(),
  source: z.string().trim().min(1).max(40).default("complex_detail")
});

export async function POST(req: NextRequest) {
  const started = performance.now();
  let status = 200;

  try {
    const body = bodySchema.parse(await req.json());
    const now = new Date().toISOString();

    if (hasDatabaseUrl()) {
      const pool = getDbPool();
      await pool.query(
        `
        INSERT INTO audit_log (
          actor_type, actor_id, target_type, target_id, event_name, after_json, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
        `,
        [
          "anonymous",
          null,
          "complex",
          body.complexId,
          `cta_click:${body.action}`,
          JSON.stringify({ source: body.source, at: now })
        ]
      );
    }

    console.info(
      `[cta-click] action=${body.action} complexId=${body.complexId} source=${body.source} at=${now}`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    logApiError("POST /api/events/cta", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    status = 400;
    return NextResponse.json({ ok: false, code: "BAD_REQUEST", error: message }, { status });
  } finally {
    recordApiMetric("POST /api/events/cta", performance.now() - started, status);
  }
}

