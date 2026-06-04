import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";

const Body = z.object({
  match_id: z.string().uuid(),
  result_1: z.number().int().min(0).max(30).nullable(),
  result_2: z.number().int().min(0).max(30).nullable(),
});

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Verboten" }, { status: 403 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const sb = supabaseService();
  const { error } = await sb
    .from("matches")
    .update({
      result_1: parsed.data.result_1,
      result_2: parsed.data.result_2,
      result_synced_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.match_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
