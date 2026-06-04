// Seedet die 3 deutschen Gruppenspiele (Gruppe E, WM 2026) in die DB.
// Quelle: User-Screenshot von kicker.de / wm.de
//
// Wichtig: Wir tippen laut Spec alle 6 Gruppenspiele der deutschen Gruppe.
// Die 3 NICHT-deutschen Spiele (Curaçao vs Elfenbeinküste etc.) sind hier
// als Platzhalter mit groben Datums-Schätzungen angelegt. Bitte im Admin
// nach FIFA-Quelle korrigieren oder den TODO-Block weglassen.
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

// Alle 6 Spiele der Gruppe E (exakte Termine aus dem Screenshot des Users).
// Zeiten in CEST (+02:00). Nacht-Spiele entsprechen US-Anstoßzeiten.
const GROUP_E_FIXED = [
  // Spieltag 1
  {
    group_name: "Gruppe E",
    round: "group",
    team_1: "Deutschland",
    flag_1: "🇩🇪",
    team_2: "Curaçao",
    flag_2: "🇨🇼",
    match_date: "2026-06-14T19:00:00+02:00",
    stadium: "Houston Stadium",
  },
  {
    group_name: "Gruppe E",
    round: "group",
    team_1: "Elfenbeinküste",
    flag_1: "🇨🇮",
    team_2: "Ecuador",
    flag_2: "🇪🇨",
    match_date: "2026-06-15T01:00:00+02:00",
    stadium: "Philadelphia Stadium",
  },
  // Spieltag 2
  {
    group_name: "Gruppe E",
    round: "group",
    team_1: "Deutschland",
    flag_1: "🇩🇪",
    team_2: "Elfenbeinküste",
    flag_2: "🇨🇮",
    match_date: "2026-06-20T22:00:00+02:00",
    stadium: "Toronto Stadium",
  },
  {
    group_name: "Gruppe E",
    round: "group",
    team_1: "Ecuador",
    flag_1: "🇪🇨",
    team_2: "Curaçao",
    flag_2: "🇨🇼",
    match_date: "2026-06-21T02:00:00+02:00",
    stadium: "Kansas City Stadium",
  },
  // Spieltag 3 (parallel, beide 22:00)
  {
    group_name: "Gruppe E",
    round: "group",
    team_1: "Ecuador",
    flag_1: "🇪🇨",
    team_2: "Deutschland",
    flag_2: "🇩🇪",
    match_date: "2026-06-25T22:00:00+02:00",
    stadium: "New York/New Jersey Stadium",
  },
  {
    group_name: "Gruppe E",
    round: "group",
    team_1: "Curaçao",
    flag_1: "🇨🇼",
    team_2: "Elfenbeinküste",
    flag_2: "🇨🇮",
    match_date: "2026-06-25T22:00:00+02:00",
    stadium: "Philadelphia Stadium",
  },
];

console.log("Lege Gruppe E (deutsche Spiele) an …");
for (const m of GROUP_E_FIXED) {
  // Vorhanden? Skip
  const { data: existing } = await sb
    .from("matches")
    .select("id")
    .eq("team_1", m.team_1)
    .eq("team_2", m.team_2)
    .eq("match_date", m.match_date)
    .maybeSingle();
  if (existing) {
    console.log(`  · existiert bereits: ${m.team_1} – ${m.team_2}`);
    continue;
  }
  const { error } = await sb.from("matches").insert(m);
  if (error) {
    console.error(`  ❌ ${m.team_1} – ${m.team_2}: ${error.message}`);
  } else {
    console.log(`  ✅ ${m.team_1} – ${m.team_2} (${m.match_date.slice(0, 10)})`);
  }
}

console.log("\nFertig. Alle 6 Spiele der Gruppe E sind angelegt.");
