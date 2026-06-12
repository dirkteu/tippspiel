/**
 * Offizieller K.o.-Spielbaum der WM 2026 (Spiele 73–104).
 *
 * Quelle: FIFA-Spielplan / Wikipedia "2026 FIFA World Cup knockout stage".
 * Alle Anstoßzeiten sind von der lokalen Stadionzeit nach CEST (+02:00)
 * umgerechnet — gleiches Format wie scripts/seed-group-e.mjs. Nachtspiele
 * entsprechen US-Anstoßzeiten.
 *
 * Stadium-Namen folgen der FIFA-Nomenklatur ("Houston Stadium" statt
 * "NRG Stadium"), konsistent zu den bereits geseedeten Gruppenspielen.
 *
 * Deutschlands Pfad (Gruppe E):
 *   - als Gruppensieger:  Spiel 74 → 89 → 97 → 101 → Finale
 *   - als Gruppenzweiter: Spiel 78 → 91 → 99 → 102 → Finale
 *   - als Gruppendritter: eines von Spiel 79/80/81/82/85/87
 */

export type KoRound = "r32" | "r16" | "qf" | "sf" | "3rd" | "final";

export interface KoMatch {
  /** Offizielle FIFA-Spielnummer (73–104). */
  match_no: number;
  round: KoRound;
  /** Anstoß als ISO-String mit CEST-Offset. */
  kickoff: string;
  stadium: string;
  /** Herkunft Team 1, z. B. "1. Gruppe E" oder "Sieger Spiel 74". */
  slot_1: string;
  /** Herkunft Team 2. */
  slot_2: string;
}

export const KO_ROUND_LABEL: Record<KoRound, string> = {
  r32: "Sechzehntelfinale",
  r16: "Achtelfinale",
  qf: "Viertelfinale",
  sf: "Halbfinale",
  "3rd": "Spiel um Platz 3",
  final: "Finale",
};

export const KO_BRACKET: KoMatch[] = [
  // ---------------- Sechzehntelfinale (28.06.–04.07. CEST) ----------------
  { match_no: 73, round: "r32", kickoff: "2026-06-28T21:00:00+02:00", stadium: "Los Angeles Stadium", slot_1: "2. Gruppe A", slot_2: "2. Gruppe B" },
  { match_no: 74, round: "r32", kickoff: "2026-06-29T22:30:00+02:00", stadium: "Boston Stadium", slot_1: "1. Gruppe E", slot_2: "3. Gruppe A/B/C/D/F" },
  { match_no: 75, round: "r32", kickoff: "2026-06-30T03:00:00+02:00", stadium: "Monterrey Stadium", slot_1: "1. Gruppe F", slot_2: "2. Gruppe C" },
  { match_no: 76, round: "r32", kickoff: "2026-06-29T19:00:00+02:00", stadium: "Houston Stadium", slot_1: "1. Gruppe C", slot_2: "2. Gruppe F" },
  { match_no: 77, round: "r32", kickoff: "2026-06-30T23:00:00+02:00", stadium: "New York/New Jersey Stadium", slot_1: "1. Gruppe I", slot_2: "3. Gruppe C/D/F/G/H" },
  { match_no: 78, round: "r32", kickoff: "2026-06-30T19:00:00+02:00", stadium: "Dallas Stadium", slot_1: "2. Gruppe E", slot_2: "2. Gruppe I" },
  { match_no: 79, round: "r32", kickoff: "2026-07-01T03:00:00+02:00", stadium: "Mexico City Stadium", slot_1: "1. Gruppe A", slot_2: "3. Gruppe C/E/F/H/I" },
  { match_no: 80, round: "r32", kickoff: "2026-07-01T18:00:00+02:00", stadium: "Atlanta Stadium", slot_1: "1. Gruppe L", slot_2: "3. Gruppe E/H/I/J/K" },
  { match_no: 81, round: "r32", kickoff: "2026-07-02T02:00:00+02:00", stadium: "San Francisco Bay Area Stadium", slot_1: "1. Gruppe D", slot_2: "3. Gruppe B/E/F/I/J" },
  { match_no: 82, round: "r32", kickoff: "2026-07-01T22:00:00+02:00", stadium: "Seattle Stadium", slot_1: "1. Gruppe G", slot_2: "3. Gruppe A/E/H/I/J" },
  { match_no: 83, round: "r32", kickoff: "2026-07-03T01:00:00+02:00", stadium: "Toronto Stadium", slot_1: "2. Gruppe K", slot_2: "2. Gruppe L" },
  { match_no: 84, round: "r32", kickoff: "2026-07-02T21:00:00+02:00", stadium: "Los Angeles Stadium", slot_1: "1. Gruppe H", slot_2: "2. Gruppe J" },
  { match_no: 85, round: "r32", kickoff: "2026-07-03T05:00:00+02:00", stadium: "Vancouver Stadium", slot_1: "1. Gruppe B", slot_2: "3. Gruppe E/F/G/I/J" },
  { match_no: 86, round: "r32", kickoff: "2026-07-04T00:00:00+02:00", stadium: "Miami Stadium", slot_1: "1. Gruppe J", slot_2: "2. Gruppe H" },
  { match_no: 87, round: "r32", kickoff: "2026-07-04T03:30:00+02:00", stadium: "Kansas City Stadium", slot_1: "1. Gruppe K", slot_2: "3. Gruppe D/E/I/J/L" },
  { match_no: 88, round: "r32", kickoff: "2026-07-03T20:00:00+02:00", stadium: "Dallas Stadium", slot_1: "2. Gruppe D", slot_2: "2. Gruppe G" },
  // ---------------- Achtelfinale (04.–07.07.) ----------------
  { match_no: 89, round: "r16", kickoff: "2026-07-04T23:00:00+02:00", stadium: "Philadelphia Stadium", slot_1: "Sieger Spiel 74", slot_2: "Sieger Spiel 77" },
  { match_no: 90, round: "r16", kickoff: "2026-07-04T19:00:00+02:00", stadium: "Houston Stadium", slot_1: "Sieger Spiel 73", slot_2: "Sieger Spiel 75" },
  { match_no: 91, round: "r16", kickoff: "2026-07-05T22:00:00+02:00", stadium: "New York/New Jersey Stadium", slot_1: "Sieger Spiel 76", slot_2: "Sieger Spiel 78" },
  { match_no: 92, round: "r16", kickoff: "2026-07-06T02:00:00+02:00", stadium: "Mexico City Stadium", slot_1: "Sieger Spiel 79", slot_2: "Sieger Spiel 80" },
  { match_no: 93, round: "r16", kickoff: "2026-07-06T21:00:00+02:00", stadium: "Dallas Stadium", slot_1: "Sieger Spiel 83", slot_2: "Sieger Spiel 84" },
  { match_no: 94, round: "r16", kickoff: "2026-07-07T02:00:00+02:00", stadium: "Seattle Stadium", slot_1: "Sieger Spiel 81", slot_2: "Sieger Spiel 82" },
  { match_no: 95, round: "r16", kickoff: "2026-07-07T18:00:00+02:00", stadium: "Atlanta Stadium", slot_1: "Sieger Spiel 86", slot_2: "Sieger Spiel 88" },
  { match_no: 96, round: "r16", kickoff: "2026-07-07T22:00:00+02:00", stadium: "Vancouver Stadium", slot_1: "Sieger Spiel 85", slot_2: "Sieger Spiel 87" },
  // ---------------- Viertelfinale (09.–12.07.) ----------------
  { match_no: 97, round: "qf", kickoff: "2026-07-09T22:00:00+02:00", stadium: "Boston Stadium", slot_1: "Sieger Spiel 89", slot_2: "Sieger Spiel 90" },
  { match_no: 98, round: "qf", kickoff: "2026-07-10T21:00:00+02:00", stadium: "Los Angeles Stadium", slot_1: "Sieger Spiel 93", slot_2: "Sieger Spiel 94" },
  { match_no: 99, round: "qf", kickoff: "2026-07-11T23:00:00+02:00", stadium: "Miami Stadium", slot_1: "Sieger Spiel 91", slot_2: "Sieger Spiel 92" },
  { match_no: 100, round: "qf", kickoff: "2026-07-12T03:00:00+02:00", stadium: "Kansas City Stadium", slot_1: "Sieger Spiel 95", slot_2: "Sieger Spiel 96" },
  // ---------------- Halbfinale ----------------
  { match_no: 101, round: "sf", kickoff: "2026-07-14T21:00:00+02:00", stadium: "Dallas Stadium", slot_1: "Sieger Spiel 97", slot_2: "Sieger Spiel 98" },
  { match_no: 102, round: "sf", kickoff: "2026-07-15T21:00:00+02:00", stadium: "Atlanta Stadium", slot_1: "Sieger Spiel 99", slot_2: "Sieger Spiel 100" },
  // ---------------- Platz 3 + Finale ----------------
  { match_no: 103, round: "3rd", kickoff: "2026-07-18T23:00:00+02:00", stadium: "Miami Stadium", slot_1: "Verlierer Spiel 101", slot_2: "Verlierer Spiel 102" },
  { match_no: 104, round: "final", kickoff: "2026-07-19T21:00:00+02:00", stadium: "New York/New Jersey Stadium", slot_1: "Sieger Spiel 101", slot_2: "Sieger Spiel 102" },
];

/** group_name-Konvention für KO-Spiele in der DB: "Spiel 74". */
export function koGroupName(match_no: number): string {
  return `Spiel ${match_no}`;
}

/** Anzeige-Label, z. B. "Spiel 74 · Sechzehntelfinale". */
export function koMatchLabel(m: KoMatch): string {
  return `${koGroupName(m.match_no)} · ${KO_ROUND_LABEL[m.round]}`;
}

export function findKoMatch(match_no: number): KoMatch | undefined {
  return KO_BRACKET.find((m) => m.match_no === match_no);
}
