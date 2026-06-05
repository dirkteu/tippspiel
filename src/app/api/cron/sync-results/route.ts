import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { readEnv } from "@/lib/env";

const Body = z.object({
  updates: z.array(
    z.object({
      api_fixture_id: z.number().int(),
      result_1: z.number().int().min(0).max(30).nullable(),
      result_2: z.number().int().min(0).max(30).nullable(),
    }),
  ),
});

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== readEnv("CRON_SECRET")) {
    return NextResponse.json({ error: "Verboten" }, { status: 403 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const sb = supabaseService();
  const now = new Date().toISOString();
  let updated = 0;
  for (const u of parsed.data.updates) {
    const { error, count } = await sb
      .from("matches")
      .update({
        result_1: u.result_1,
        result_2: u.result_2,
        result_synced_at: now,
      }, { count: "exact" })
      .eq("api_fixture_id", u.api_fixture_id);
    if (!error && count) updated += count;
  }
  return NextResponse.json({ ok: true, updated });
}
