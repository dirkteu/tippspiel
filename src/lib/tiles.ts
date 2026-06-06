/**
 * Kachel-Freischalt-Logik (3×3 Secret Partner Grid).
 *
 * 9 Kacheln werden im Lauf der WM-Vorrunde freigeschaltet:
 *
 *  - **Basis-Kachel (max. 6):** Pro gewertetem Vorrundenspiel (Admin hat
 *    result_1 / result_2 eingetragen) fällt eine Kachel. Es zählen die
 *    ersten 6 Group-Matches in chronologischer Reihenfolge (Heuristik für
 *    die WM-Gruppe, in der das Tippspiel stattfindet — typischerweise 6
 *    Spiele à la "Gruppe E").
 *
 *  - **Volltreffer-Bonus (zusätzlich):** Pro Vorrundenspiel, in dem ein
 *    Team-Mitglied ≥3 Punkte erzielt hat, fällt eine WEITERE Kachel.
 *    Der Bonus zählt für alle Vorrundenspiele (auch über die ersten 6
 *    hinaus), nicht aber für K.o.-Runden.
 *
 *  - **Cap bei 9** — mehr als das Grid hergibt geht nicht. Beispiele:
 *      • 6 gespielte Vorrundenspiele, 0 Volltreffer → 6 Kacheln
 *      • 6 gespielte Vorrundenspiele, 3 Volltreffer → 9 Kacheln (cap)
 *      • 3 gespielte Vorrundenspiele, 1 Volltreffer → 4 Kacheln
 *
 *  - **Im Finale wird NICHT automatisch enthüllt** — alle Kacheln fallen
 *    nur, wenn der Spieler den Partner richtig erraten hat (oder die 9
 *    auf natürlichem Weg erreicht werden).
 */

export type Round = "group" | "r32" | "r16" | "qf" | "sf" | "3rd" | "final";

export interface MatchLite {
  id: string;
  round: Round;
  match_date: string; // ISO
  /** Eingetragenes Ergebnis Heim / Auswaerts; null = noch nicht gewertet. */
  result_1: number | null;
  result_2: number | null;
}

export interface TipLite {
  match_id: string;
  profile_id: string;
  points_earned: number;
}

export interface TeamLite {
  member_profile_ids: string[]; // beide Mitglieder (m und f)
}

/**
 * Liefert die Anzahl der bisher freigeschalteten Kacheln (0..9).
 *
 * @param team       Team mit Mitglieder-Profil-IDs
 * @param matches    alle Matches des Turniers (Reihenfolge egal — wird sortiert)
 * @param tips       alle Tipps der beiden Team-Mitglieder
 * @param _now       (ungenutzt — historisch fuer KO-Bonus, jetzt obsolet)
 */
export function tilesUnlocked(
  team: TeamLite,
  matches: MatchLite[],
  tips: TipLite[],
  _now: Date = new Date(),
): number {
  // Vorrundenspiele chronologisch sortieren
  const groupMatches = matches
    .filter((m) => m.round === "group")
    .sort(
      (a, b) =>
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    );

  // Basis: bis zu 6 Slots, gefuellt pro gewertetem Match der ersten 6
  let basis = 0;
  for (const m of groupMatches.slice(0, 6)) {
    if (m.result_1 != null && m.result_2 != null) basis += 1;
  }

  // Bonus: pro Vorrundenspiel mit >=3 Punkten eines Team-Mitglieds.
  // Bonus zaehlt fuer alle Vorrundenspiele (auch jenseits der ersten 6),
  // aber nicht fuer K.o.-Runden.
  const groupIds = new Set(groupMatches.map((m) => m.id));
  const bonusMatches = new Set<string>();
  for (const t of tips) {
    if (!team.member_profile_ids.includes(t.profile_id)) continue;
    if (!groupIds.has(t.match_id)) continue;
    if (t.points_earned >= 3) bonusMatches.add(t.match_id);
  }

  return Math.min(basis + bonusMatches.size, 9);
}

/**
 * Liefert die zufällige, pro Team feste Reihenfolge, in der die 9 Kacheln
 * visuell verschwinden. tileOrder ist die in DB persistierte Permutation
 * von [1..9]. tilesOpen ist die Anzahl gefallener Kacheln (0..9).
 *
 * Rückgabe: Set der Kachel-Positionen (0..8), die aktuell offen/durchsichtig sind.
 */
export function openTilePositions(
  tileOrder: number[],
  tilesOpen: number,
): Set<number> {
  const open = new Set<number>();
  for (let i = 0; i < tilesOpen; i++) {
    const pos = tileOrder[i];
    if (typeof pos === "number") {
      // tile_order ist 1-basiert in der DB → Position 0-basiert für CSS-Grid
      open.add(pos - 1);
    }
  }
  return open;
}
