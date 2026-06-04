import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";

const Body = z.object({
  group_name: z.string().min(1).max(40),
  round: z.enum(["group", "r32", "r16", "qf", "sf", "3rd", "final"]),
  team_1: z.string().min(1).max(40),
  team_2: z.string().min(1).max(40),
  flag_1: z.string().min(1).max(8),
  flag_2: z.string().min(1).max(8),
  match_date: z.string().datetime({ offset: true }),
  stadium: z.string().max(80).optional().nullable(),
});

/** Neues Spiel anlegen. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Verboten" }, { status: 403 });
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const sb = supabaseService();
  const { data, error } = await sb
    .from("matches")
    .insert(parsed.data)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ match: data });
}
