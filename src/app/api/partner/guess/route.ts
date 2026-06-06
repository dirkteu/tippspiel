import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import {
  fetchAllMatches,
  fetchTeamMemberIds,
  fetchTipsForTeam,
} from "@/lib/matches";
import { tilesUnlocked } from "@/lib/tiles";

const Body = z.object({
  guessed_profile_id: z.string().uuid(),
});

/**
 * Partner-Auflösung: User rät, welcher Roster-Spieler des anderen
 * Geschlechts sein/ihre echter Spielpartner ist (gleiches team_id).
 *
 * Antwort:
 *   { correct: true,  revealed_name: "topstürmer", wrong_guesses, tiles_open }   bei Treffer
 *   { correct: false, revealed_name: null,         wrong_guesses, tiles_open }   bei daneben
 *
 * Bei daneben wird wrong_partner_guesses inkrementiert, **aber nur** wenn
 * der aktuelle Counter noch unter der aktuell freigeschalteten Kachelzahl
 * liegt. So kann der Spieler in einer Phase ohne offene Kacheln nicht in
 * den Negativbereich gestraft werden.
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
  const [partnerRes, meRes] = await Promise.all([
    sb
      .from("profiles")
      .select("id,username")
      .eq("team_id", session.team.id)
      .eq("gender", partnerGender)
      .maybeSingle(),
    sb
      .from("profiles")
      .select("wrong_partner_guesses")
      .eq("id", session.profile.id)
      .maybeSingle(),
  ]);

  const realPartner = partnerRes.data;
  if (!realPartner) {
    return NextResponse.json(
      { error: "Dein Partner ist noch nicht zugeordnet." },
      { status: 409 },
    );
  }

  const correct = realPartner.id === guessed_profile_id;
  let wrongGuesses = meRes.data?.wrong_partner_guesses ?? 0;

  // Aktuellen Kachelstand neu berechnen, damit Response & Cap stimmen.
  const memberIds = await fetchTeamMemberIds(session.team.id);
  const [matches, tips] = await Promise.all([
    fetchAllMatches(),
    fetchTipsForTeam(memberIds),
  ]);
  const unlocked = tilesUnlocked(
    session.profile.id,
    matches.map((m) => ({
      id: m.id,
      round: m.round,
      match_date: m.match_date,
      result_1: m.result_1,
      result_2: m.result_2,
    })),
    tips.map((t) => ({
      match_id: t.match_id,
      profile_id: t.profile_id,
      points_earned: t.points_earned,
    })),
  );

  if (correct) {
    // Bei Treffer: Zeitstempel speichern, damit die Auflösung nach Reload
    // bestehen bleibt. Idempotent: nur beim ersten Mal setzen.
    await sb
      .from("profiles")
      .update({ partner_revealed_at: new Date().toISOString() })
      .eq("id", session.profile.id)
      .is("partner_revealed_at", null);
  } else {
    // Bei Fehlschuss: Counter +1, aber nur wenn noch Kacheln zum
    // "Bestrafen" da sind. Cap = aktuelle effektive Anzahl offener
    // Kacheln (max 0..unlocked).
    if (wrongGuesses < unlocked) {
      wrongGuesses += 1;
      await sb
        .from("profiles")
        .update({ wrong_partner_guesses: wrongGuesses })
        .eq("id", session.profile.id);
    }
  }

  const tilesOpen = Math.max(0, unlocked - wrongGuesses);

  return NextResponse.json({
    correct,
    revealed_name: correct ? realPartner.username : null,
    wrong_guesses: wrongGuesses,
    tiles_open: tilesOpen,
  });
}
