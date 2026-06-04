import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Roster-Eintrag löschen (nur möglich solange Spieler nicht beigetreten ist). */
export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Verboten" }, { status: 403 });
  const { id } = await ctx.params;
  const sb = supabaseService();

  const { data: prof } = await sb
    .from("profiles")
    .select("joined_at")
    .eq("id", id)
    .maybeSingle();
  if (prof?.joined_at) {
    return NextResponse.json(
      { error: "Spieler ist bereits beigetreten — löschen nicht erlaubt" },
      { status: 409 },
    );
  }
  const { error } = await sb.from("profiles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
