import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";

interface Ctx {
  params: Promise<{ id: string }>;
}

const Body = z.object({
  team_name: z.string().min(2).max(40),
});

/** Admin-Override: Team-Namen manuell setzen — Notfall-Fallback,
 *  falls der/die ausgeloste Owner nie joinet. */
export async function POST(req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Verboten" }, { status: 403 });
  const { id } = await ctx.params;

  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Team-Name muss 2–40 Zeichen lang sein" },
      { status: 400 },
    );
  }

  const sb = supabaseService();
  const { error } = await sb
    .from("teams")
    .update({ team_name: parsed.data.team_name })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
