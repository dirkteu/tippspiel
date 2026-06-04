// End-to-End-Smoke-Test:
//  1. Match anlegen (gestern, damit nicht gesperrt → in 1 Tag)
//  2. Team + 2 Profile (m + f) anlegen
//  3. Tipp speichern → Trigger-Punkte = 0 (noch kein Ergebnis)
//  4. Ergebnis eintragen → Punkte werden via Trigger neu gesetzt
//  5. Champion-Tipp + official_champion → 10 Punkte
//  6. Aufräumen
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let cleanup = { matchId: null, teamId: null, profileMId: null, profileFId: null };

function log(label, ok, extra = "") {
  console.log(`${ok ? "✅" : "❌"} ${label}${extra ? " — " + extra : ""}`);
  if (!ok) process.exitCode = 1;
}

try {
  // 1. Match
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: match, error: matchErr } = await sb
    .from("matches")
    .insert({
      group_name: "Test-Gruppe",
      round: "group",
      team_1: "Deutschland",
      team_2: "Mexiko",
      flag_1: "🇩🇪",
      flag_2: "🇲🇽",
      match_date: tomorrow,
    })
    .select()
    .single();
  log("Match anlegen", !matchErr, matchErr?.message);
  if (matchErr) throw matchErr;
  cleanup.matchId = match.id;
  log("locked_at via Trigger gesetzt", !!match.locked_at, match.locked_at);

  // 2. Team + Profile
  const suffix = Date.now();
  const { data: team, error: teamErr } = await sb
    .from("teams")
    .insert({
      invite_code_male: "SMOKE_M_" + suffix,
      invite_code_female: "SMOKE_F_" + suffix,
    })
    .select()
    .single();
  log("Team anlegen", !teamErr, teamErr?.message);
  if (teamErr) throw teamErr;
  cleanup.teamId = team.id;
  log("tile_order zufällig generiert", Array.isArray(team.tile_order) && team.tile_order.length === 9, JSON.stringify(team.tile_order));

  const { data: profM, error: profMErr } = await sb
    .from("profiles")
    .insert({
      team_id: team.id,
      username: "SmokeMann_" + suffix,
      gender: "m",
      login_token: "smoke_token_m_" + suffix,
    })
    .select()
    .single();
  log("Profil Mann anlegen", !profMErr, profMErr?.message);
  if (profMErr) throw profMErr;
  cleanup.profileMId = profM.id;

  const { data: profF, error: profFErr } = await sb
    .from("profiles")
    .insert({
      team_id: team.id,
      username: "SmokeFrau_" + suffix,
      gender: "f",
      login_token: "smoke_token_f_" + suffix,
    })
    .select()
    .single();
  log("Profil Frau anlegen", !profFErr, profFErr?.message);
  if (profFErr) throw profFErr;
  cleanup.profileFId = profF.id;

  // 3. Tipp Mann 2:1
  const { data: tipM, error: tipMErr } = await sb
    .from("tips")
    .insert({ profile_id: profM.id, match_id: match.id, tip_1: 2, tip_2: 1 })
    .select()
    .single();
  log("Tipp Mann 2:1 (kein Ergebnis → 0 Pkt)", !tipMErr && tipM.points_earned === 0, `points=${tipM?.points_earned}`);

  // 4. Ergebnis eintragen → Recalc-Trigger feuert
  const { error: resErr } = await sb
    .from("matches")
    .update({ result_1: 2, result_2: 1 })
    .eq("id", match.id);
  log("Ergebnis 2:1 eintragen", !resErr, resErr?.message);

  const { data: tipMReloaded } = await sb
    .from("tips")
    .select("points_earned")
    .eq("id", tipM.id)
    .single();
  log("Trigger recalc → 4 Pkt (exakt)", tipMReloaded?.points_earned === 4, `points=${tipMReloaded?.points_earned}`);

  // 5. Champion-Tipp
  const { data: champ, error: champErr } = await sb
    .from("champion_tips")
    .insert({ profile_id: profM.id, champion_team: "Deutschland" })
    .select()
    .single();
  log("Champion-Tipp Deutschland", !champErr, champErr?.message);

  const { error: confErr } = await sb
    .from("tournament_config")
    .update({ official_champion: "Deutschland" })
    .eq("id", 1);
  log("official_champion auf Deutschland setzen", !confErr, confErr?.message);

  const { data: champReloaded } = await sb
    .from("champion_tips")
    .select("points_earned")
    .eq("profile_id", profM.id)
    .single();
  log("Champion-Recalc → 10 Pkt", champReloaded?.points_earned === 10, `points=${champReloaded?.points_earned}`);
} catch (e) {
  console.error("ABBRUCH:", e.message);
} finally {
  console.log("\n--- Cleanup ---");
  // Reverse order
  await sb.from("tournament_config").update({ official_champion: null }).eq("id", 1);
  if (cleanup.profileMId) await sb.from("profiles").delete().eq("id", cleanup.profileMId);
  if (cleanup.profileFId) await sb.from("profiles").delete().eq("id", cleanup.profileFId);
  if (cleanup.teamId) await sb.from("teams").delete().eq("id", cleanup.teamId);
  if (cleanup.matchId) await sb.from("matches").delete().eq("id", cleanup.matchId);
  console.log("Cleanup fertig.");
}
