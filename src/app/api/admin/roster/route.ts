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

  // Retry-Loop: 5-stellige Codes können in seltenen Fällen kollidieren.
  // Postgres unique_violation = 23505 → einfach neuen Code würfeln.
  let data: { id: string; real_name: string; gender: "m" | "f"; real_partner_id: string | null; invite_code: string } | null = null;
  let lastErr: { message: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const insert = await sb
      .from("profiles")
      .insert({
        real_name: parsed.data.real_name,
        gender: parsed.data.gender,
        real_partner_id: parsed.data.real_partner_id ?? null,
        invite_code: generateInviteCode(),
      })
      .select("id,real_name,gender,real_partner_id,invite_code")
      .single();
    if (!insert.error) {
      data = insert.data;
      break;
    }
    lastErr = insert.error;
    if (insert.error.code !== "23505") break; // anderer Fehler → abbrechen
  }
  if (!data) {
    return NextResponse.json(
      { error: lastErr?.message ?? "Insert fehlgeschlagen" },
      { status: 500 },
    );
  }

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
