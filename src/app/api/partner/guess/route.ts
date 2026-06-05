import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";

const Body = z.object({
  guessed_profile_id: z.string().uuid(),
});

/**
 * Partner-Auflösung: User rät, welcher Roster-Spieler des anderen
 * Geschlechts sein/ihre echter Spielpartner ist (gleiches team_id).
 *
 * Antwort:
 *   { correct: true,  revealed_name: "topstürmer" }   bei Treffer
 *   { correct: false }                                 bei daneben
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const { guessed_profile_id } = parsed.data;

  const sb = supabaseService();
  const partnerGender = session.profile.gender === "m" ? "f" : "m";
  const { data: realPartner } = await sb
    .from("profiles")
    .select("id,username")
    .eq("team_id", session.team.id)
    .eq("gender", partnerGender)
    .maybeSingle();

  if (!realPartner) {
    return NextResponse.json(
      { error: "Dein Partner ist noch nicht zugeordnet." },
      { status: 409 },
    );
  }

  const correct = realPartner.id === guessed_profile_id;
  return NextResponse.json({
    correct,
    revealed_name: correct ? realPartner.username : null,
  });
}
