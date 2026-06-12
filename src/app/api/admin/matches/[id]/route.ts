import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";

interface Ctx {
  params: Promise<{ id: string }>;
}

const PatchBody = z.object({
  group_name: z.string().min(1).max(40).optional(),
  team_1: z.string().min(1).max(40).optional(),
  team_2: z.string().min(1).max(40).optional(),
  flag_1: z.string().min(1).max(8).optional(),
  flag_2: z.string().min(1).max(8).optional(),
  match_date: z.string().datetime({ offset: true }).optional(),
  stadium: z.string().max(80).nullable().optional(),
});

/**
 * Spiel bearbeiten (Teams, Datum, Stadion, …) — z. B. um KO-Paarungen
 * einzutragen, sobald sie feststehen, oder Anstoßzeiten zu korrigieren.
 * locked_at zieht der DB-Trigger set_locked_at automatisch nach.
 */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Verboten" }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Keine Felder zum Ändern" }, { status: 400 });
  }
  const sb = supabaseService();
  const { data, error } = await sb
    .from("matches")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ match: data });
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
