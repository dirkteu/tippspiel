import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import { generatePairings, type RosterPlayer } from "@/lib/pairing";

/**
 * Spielteams würfeln.
 *
 * Verhalten:
 * - Nur Spieler ohne team_id und ohne joined_at werden in NEUE Teams gewürfelt.
 * - Bestehende Teams bleiben unangetastet (egal ob ihre Mitglieder schon
 *   beigetreten sind oder nicht).
 * - Voraussetzung: gleich viele freie Männer + Frauen im Pool.
 */
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Verboten" }, { status: 403 });
  const sb = supabaseService();

  // 1. Nur den freien Pool laden (kein Team, noch nicht beigetreten)
  const { data: pool, error: poolErr } = await sb
    .from("profiles")
    .select("id,real_name,gender,real_partner_id,joined_at")
    .is("team_id", null)
    .is("joined_at", null);
  if (poolErr) return NextResponse.json({ error: poolErr.message }, { status: 500 });

  if (!pool || pool.length === 0) {
    return NextResponse.json(
      { error: "Alle Spieler sind bereits einem Team zugeordnet — nichts zu würfeln." },
      { status: 409 },
    );
  }

  const m = pool.filter((p) => p.gender === "m").length;
  const f = pool.filter((p) => p.gender === "f").length;
  if (m !== f) {
    return NextResponse.json(
      {
        error: `Ungleicher Pool: ${m} Männer / ${f} Frauen. Füge Spieler hinzu oder lösche welche, damit die Anzahl gleich ist.`,
      },
      { status: 409 },
    );
  }

  // 2. Paarungen würfeln (nur freier Pool, bestehende Teams bleiben)
  let pairings;
  try {
    pairings = generatePairings(pool as RosterPlayer[]);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // 4. Pro Paarung ein Team anlegen + beide Profile zuweisen
  const created: { teamId: string; male: string; female: string }[] = [];
  for (const pair of pairings) {
    const { data: team, error: teamErr } = await sb
      .from("teams")
      .insert({})
      .select("id")
      .single();
    if (teamErr) {
      return NextResponse.json(
        { error: "Team-Insert fehlgeschlagen: " + teamErr.message },
        { status: 500 },
      );
    }
    const updateMale = await sb
      .from("profiles")
      .update({ team_id: team.id })
      .eq("id", pair.male.id);
    const updateFemale = await sb
      .from("profiles")
      .update({ team_id: team.id })
      .eq("id", pair.female.id);
    if (updateMale.error || updateFemale.error) {
      return NextResponse.json(
        {
          error:
            "Zuordnung fehlgeschlagen: " +
            (updateMale.error?.message ?? updateFemale.error?.message),
        },
        { status: 500 },
      );
    }
    created.push({ teamId: team.id, male: pair.male.id, female: pair.female.id });
  }

  return NextResponse.json({ ok: true, teams: created });
}
