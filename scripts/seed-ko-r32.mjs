// Seedet die feststehenden Sechzehntelfinal-Spiele (Round of 32, WM 2026) in die DB.
//
// Zwei-Phasen-Import: Hier stehen NUR die Paarungen, deren beide Teams bereits
// offiziell feststehen (Quelle: SI "Every Confirmed Round of 32 Match", abgeglichen
// mit dem KO-Spielbaum src/lib/wm2026-ko.ts über Datum + Stadion). Spiele mit noch
// offenem Slot ("3. Gruppe …" bzw. noch nicht entschiedene Gruppen) folgen in
// Phase 2 — dann einfach unten in PAIRINGS ergänzen und das Skript erneut laufen
// lassen (idempotent: vorhandene "Spiel NN" werden übersprungen, keine Dubletten).
//
// Datum/Stadion/round werden NICHT abgetippt, sondern zur Laufzeit aus der Vorlage
// (KO_BRACKET) gelesen; Flaggen aus der Single-Source-of-Truth WM2026_TEAMS.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ---- .env.local einlesen (wie scripts/seed-group-e.mjs) ----
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

// ---- Paarungen (slot_1 zuerst, gem. KO_BRACKET) ----
const PAIRINGS = {
  // Phase 1 (27.06.): bereits feststehende Paarungen
  73: ["Südafrika", "Kanada"], //            2.A – 2.B
  74: ["Deutschland", "Paraguay"], //        1.E – 3. Gruppe D
  75: ["Niederlande", "Marokko"], //         1.F – 2.C
  76: ["Brasilien", "Japan"], //             1.C – 2.F
  77: ["Frankreich", "Schweden"], //         1.I – 3. Gruppe F
  78: ["Elfenbeinküste", "Norwegen"], //     2.E – 2.I
  81: ["USA", "Bosnien-Herzegowina"], //     1.D – 3. Gruppe B
  86: ["Argentinien", "Kap Verde"], //       1.J – 2.H
  88: ["Australien", "Ägypten"], //          2.D – 2.G
  // Phase 2 (nach Abschluss der Gruppenphase): restliche Drittplatzierten-Slots
  79: ["Mexiko", "Ecuador"], //              1.A – 3. Gruppe E
  80: ["England", "DR Kongo"], //            1.L – 3. Gruppe K
  82: ["Belgien", "Senegal"], //             1.G – 3. Gruppe I
  83: ["Portugal", "Kroatien"], //           2.K – 2.L
  84: ["Spanien", "Österreich"], //          1.H – 2.J
  85: ["Schweiz", "Algerien"], //            1.B – 3. Gruppe J
  87: ["Kolumbien", "Ghana"], //             1.K – 3. Gruppe L
};

console.log("Lege Sechzehntelfinal-Spiele an …");
let created = 0;
let skipped = 0;
for (const [noStr, [team_1, team_2]] of Object.entries(PAIRINGS)) {
  const no = Number(noStr);
  const tpl = KO[no];
  if (!tpl || tpl.round !== "r32") {
    console.error(`❌ Spiel ${no}: keine r32-Vorlage in wm2026-ko.ts gefunden. Abbruch.`);
    process.exit(1);
  }
  const group_name = `Spiel ${no}`;

  // Vorhanden? -> nicht anfassen (kein Clobbern manueller Admin-Korrekturen)
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
console.log(`Insgesamt definiert: ${Object.keys(PAIRINGS).length}/16 Sechzehntelfinal-Spiele.`);
