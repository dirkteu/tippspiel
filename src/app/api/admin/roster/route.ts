import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { generateInviteCode } from "@/lib/auth";
import { isAdmin } from "@/lib/admin-auth";

const Body = z.object({
  real_name: z.string().min(1).max(60),
  gender: z.enum(["m", "f"]),
  real_partner_id: z.string().uuid().nullable().optional(),
});

/** Spieler zum Roster hinzufügen. */
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
    .from("profiles")
    .insert({
      real_name: parsed.data.real_name,
      gender: parsed.data.gender,
      real_partner_id: parsed.data.real_partner_id ?? null,
      invite_code: generateInviteCode(),
    })
    .select("id,real_name,gender,real_partner_id,invite_code")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Wenn echter Partner angegeben: Reziprozität herstellen (auch der Partner zeigt zurück)
  if (parsed.data.real_partner_id) {
    await sb
      .from("profiles")
      .update({ real_partner_id: data.id })
      .eq("id", parsed.data.real_partner_id)
      .is("real_partner_id", null);
  }

  return NextResponse.json({ player: data });
}
