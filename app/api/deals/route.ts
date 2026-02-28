import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRecentDeals, getTopDeals } from "@/lib/api/molit";

const querySchema = z.object({
  region: z.string().regex(/^\d{5}$/),
  months: z.coerce.number().int().min(1).max(12).default(3),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  sort: z.enum(["recent", "top"]).default("recent")
});

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const parsed = querySchema.parse({
      region: params.get("region"),
      months: params.get("months") ?? 3,
      limit: params.get("limit") ?? 50,
      sort: params.get("sort") ?? "recent"
    });

    const deals = parsed.sort === "top"
      ? await getTopDeals(parsed.region, parsed.months, parsed.limit)
      : (await getRecentDeals(parsed.region, parsed.months)).slice(0, parsed.limit);

    return NextResponse.json({ ok: true, count: deals.length, deals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

