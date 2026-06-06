/**
 * Kachel-Freischalt-Logik (3×3 Secret Partner Grid).
 *
 * Wird pro SPIELER berechnet — beide Team-Mitglieder haben unabhängige
 * Fortschritte (die Bonus-Kachel ist persönlich).
 *
 *  - **Basis-Kachel (max. 6):** Pro gewertetem Vorrundenspiel (Admin hat
 *    result_1 / result_2 eingetragen) fällt eine Kachel. Es zählen die
 *    ersten 6 Group-Matches in chronologischer Reihenfolge. Basis ist
 *    für beide Mitglieder gleich (hängt nur am Match, nicht am Spieler).
 *
 *  - **Volltreffer-Bonus (zusätzlich):** Pro Vorrundenspiel, in dem DER
 *    SPIELER SELBST ≥3 Punkte erzielt hat, fällt eine WEITERE Kachel.
 *    Tipps des Partners zählen NICHT — jeder belohnt sich selbst.
 *
 *  - **Cap bei 9** — mehr als das Grid hergibt geht nicht. Beispiele:
 *      • Alex hat 1 Volltreffer im 1. Gruppenspiel, Dirk nicht:
 *        Alex sieht 2 Kacheln (Basis + Bonus), Dirk sieht 1 (nur Basis).
 *      • Vorrunde komplett, 0 eigene Volltreffer → 6 Kacheln.
 *      • Vorrunde komplett, 3 eigene Volltreffer → 9 Kacheln (cap).
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

/**
 * Liefert die Anzahl der bisher freigeschalteten Kacheln (0..9) für
 * einen einzelnen Spieler.
 *
 * @param playerProfileId  ID des Spielers, dessen Volltreffer zaehlen
 * @param matches          alle Matches des Turniers
 * @param tips             Tipps (eigene + ggf. weitere — andere werden ignoriert)
 * @param _now             ungenutzt (historisch für KO-Bonus, jetzt obsolet)
 */
export function tilesUnlocked(
  playerProfileId: string,
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

  // Bonus: pro Vorrundenspiel mit >=3 Punkten DES Spielers (nicht des
  // Partners!). Bonus zaehlt fuer alle Vorrundenspiele (auch jenseits der
  // ersten 6), aber nicht fuer K.o.-Runden.
  const groupIds = new Set(groupMatches.map((m) => m.id));
  const bonusMatches = new Set<string>();
  for (const t of tips) {
    if (t.profile_id !== playerProfileId) continue;
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
