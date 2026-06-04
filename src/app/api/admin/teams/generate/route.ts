import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import { generatePairings, type RosterPlayer } from "@/lib/pairing";

/** Spielteams würfeln. Erfordert: kein Spieler darf bereits beigetreten sein. */
export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Verboten" }, { status: 403 });
  const sb = supabaseService();

  // 1. Roster laden
  const { data: roster, error: rosterErr } = await sb
    .from("profiles")
    .select("id,real_name,gender,real_partner_id,joined_at");
  if (rosterErr) return NextResponse.json({ error: rosterErr.message }, { status: 500 });

  if ((roster ?? []).some((p) => p.joined_at)) {
    return NextResponse.json(
      { error: "Mindestens ein Spieler ist bereits beigetreten — Re-Würfeln blockiert" },
      { status: 409 },
    );
  }

  // 2. Bisherige Teams löschen (sind leer, weil noch niemand beigetreten ist)
  await sb.from("profiles").update({ team_id: null }).is("joined_at", null);
  await sb.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // 3. Paarungen würfeln
  let pairings;
  try {
    pairings = generatePairings(roster as RosterPlayer[]);
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
