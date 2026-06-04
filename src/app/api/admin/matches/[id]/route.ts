import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Spiel löschen. */
export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Verboten" }, { status: 403 });
  const { id } = await ctx.params;
  const sb = supabaseService();
  const { error } = await sb.from("matches").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
