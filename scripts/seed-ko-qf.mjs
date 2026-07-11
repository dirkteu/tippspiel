// Seedet die Viertelfinal-Spiele (Quarterfinals, WM 2026, Spiele 97–100) in die DB.
// Muster identisch zu seed-ko-r16.mjs / seed-ko-r32.mjs.
// Sieger aus den Achtelfinal-Ergebnissen; Spiel 96 (Schweiz–Kolumbien 0:0) vom
// Admin aufgelöst: Schweiz weiter. Idempotent (Dedup group_name) — 97/98 existieren
// bereits und werden übersprungen.
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

const koSrc = readFileSync("src/lib/wm2026-ko.ts", "utf8");
const KO = {};
for (const m of koSrc.matchAll(
  /match_no:\s*(\d+),\s*round:\s*"([^"]+)",\s*kickoff:\s*"([^"]+)",\s*stadium:\s*"([^"]+)"/g,
)) {
  KO[Number(m[1])] = { round: m[2], kickoff: m[3], stadium: m[4] };
}

// ---- Viertelfinal-Paarungen (slot_1 zuerst, gem. KO_BRACKET) ----
const PAIRINGS = {
  97: ["Frankreich", "Marokko"], //     Sieger 89 – Sieger 90 (existiert bereits)
  98: ["Spanien", "Belgien"], //        Sieger 93 – Sieger 94 (existiert bereits)
  99: ["Norwegen", "England"], //       Sieger 91 – Sieger 92
  100: ["Argentinien", "Schweiz"], //   Sieger 95 – Sieger 96
};

console.log("Lege Viertelfinal-Spiele an …");
let created = 0;
let skipped = 0;
for (const [noStr, [team_1, team_2]] of Object.entries(PAIRINGS)) {
  const no = Number(noStr);
  const tpl = KO[no];
  if (!tpl || tpl.round !== "qf") {
    console.error(`❌ Spiel ${no}: keine qf-Vorlage in wm2026-ko.ts gefunden. Abbruch.`);
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
