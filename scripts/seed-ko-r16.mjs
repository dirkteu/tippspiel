// Seedet die Achtelfinal-Spiele (Round of 16, WM 2026, Spiele 89–96) in die DB.
//
// Muster identisch zu scripts/seed-ko-r32.mjs: Datum/Stadion/round werden zur
// Laufzeit aus der Vorlage (KO_BRACKET) gelesen, Flaggen aus WM2026_TEAMS.
// PAIRINGS = die aufgelösten Sieger der 16tel (bei den vier 1:1-Spielen vom
// Admin bestätigt: Spiel 74->Paraguay, 75->Marokko, 86->Argentinien, 88->Ägypten).
// Idempotent: vorhandene "Spiel NN" werden übersprungen.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ---- .env.local einlesen ----
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

// ---- Flaggen aus src/lib/teams-wm2026.ts parsen (kein Hardcoden) ----
const teamsSrc = readFileSync("src/lib/teams-wm2026.ts", "utf8");
const FLAG = {};
for (const m of teamsSrc.matchAll(/\{\s*name:\s*"([^"]+)",\s*flag:\s*"([^"]+)"\s*\}/g)) {
  FLAG[m[1]] = m[2];
}

function flagOf(name) {
  const f = FLAG[name];
  if (!f) {
    console.error(`❌ Unbekanntes Team (nicht in WM2026_TEAMS): "${name}". Abbruch.`);
    process.exit(1);
  }
  return f;
}

// ---- KO-Vorlage (Datum/Stadion/round) aus src/lib/wm2026-ko.ts parsen ----
const koSrc = readFileSync("src/lib/wm2026-ko.ts", "utf8");
const KO = {}; // match_no -> { round, kickoff, stadium }
for (const m of koSrc.matchAll(
  /match_no:\s*(\d+),\s*round:\s*"([^"]+)",\s*kickoff:\s*"([^"]+)",\s*stadium:\s*"([^"]+)"/g,
)) {
  KO[Number(m[1])] = { round: m[2], kickoff: m[3], stadium: m[4] };
}

// ---- Achtelfinal-Paarungen (slot_1 zuerst, gem. KO_BRACKET) ----
const PAIRINGS = {
  89: ["Paraguay", "Frankreich"], //   Sieger 74 – Sieger 77
  90: ["Kanada", "Marokko"], //        Sieger 73 – Sieger 75
  91: ["Brasilien", "Norwegen"], //    Sieger 76 – Sieger 78
  92: ["Mexiko", "England"], //        Sieger 79 – Sieger 80
  93: ["Portugal", "Spanien"], //      Sieger 83 – Sieger 84
  94: ["USA", "Belgien"], //           Sieger 81 – Sieger 82
  95: ["Argentinien", "Ägypten"], //   Sieger 86 – Sieger 88
  96: ["Schweiz", "Kolumbien"], //     Sieger 85 – Sieger 87
};

console.log("Lege Achtelfinal-Spiele an …");
let created = 0;
let skipped = 0;
for (const [noStr, [team_1, team_2]] of Object.entries(PAIRINGS)) {
  const no = Number(noStr);
  const tpl = KO[no];
  if (!tpl || tpl.round !== "r16") {
    console.error(`❌ Spiel ${no}: keine r16-Vorlage in wm2026-ko.ts gefunden. Abbruch.`);
    process.exit(1);
  }
  const group_name = `Spiel ${no}`;

  const { data: existing } = await sb
    .from("matches")
    .select("id")
    .eq("group_name", group_name)
    .maybeSingle();
  if (existing) {
    console.log(`  · ${group_name} existiert bereits — übersprungen`);
    skipped++;
    continue;
  }

  const row = {
    group_name,
    round: tpl.round,
    team_1,
    flag_1: flagOf(team_1),
    team_2,
    flag_2: flagOf(team_2),
    match_date: tpl.kickoff,
    stadium: tpl.stadium,
  };
  const { error } = await sb.from("matches").insert(row);
  if (error) {
    console.error(`  ❌ ${group_name} (${team_1} – ${team_2}): ${error.message}`);
  } else {
    console.log(
      `  ✅ ${group_name}: ${row.flag_1} ${team_1} – ${team_2} ${row.flag_2} (${tpl.kickoff.slice(0, 10)})`,
    );
    created++;
  }
}

console.log(`\nFertig. ${created} angelegt, ${skipped} übersprungen.`);
console.log(`Achtelfinale definiert: ${Object.keys(PAIRINGS).length}/8 Spiele.`);
