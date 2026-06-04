/**
 * Kachel-Freischalt-Logik (3×3 Secret Partner Grid).
 *
 * 9 Kacheln werden im Lauf des Turniers freigeschaltet:
 *  - Kachel 1..6: nach Gruppenspiel N, wenn mindestens ein Mitglied
 *                 des Teams ≥3 Punkte in genau diesem Spiel erzielt hat.
 *  - Kachel 7:    sobald das erste Achtelfinal-Spiel angesetzt ist.
 *  - Kachel 8:    sobald das erste Viertelfinal-Spiel angesetzt ist.
 *  - Kachel 9:    sobald das erste Halbfinal-Spiel angesetzt ist.
 *
 * Im Finale ist die Maske im besten Fall komplett weg (worst case: Team
 * hat in der Gruppe alle 6 Spiele unter 3 Punkte – dann fehlen Kacheln 1..6).
 */

export type Round = "group" | "r32" | "r16" | "qf" | "sf" | "3rd" | "final";

export interface MatchLite {
  id: string;
  round: Round;
  match_date: string; // ISO
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
 * @param matches    alle Matches des Turniers (sortiert nach Datum aufsteigend)
 * @param tips       alle Tipps der beiden Team-Mitglieder
 * @param now        aktueller Zeitpunkt (für Tests injizierbar)
 */
export function tilesUnlocked(
  team: TeamLite,
  matches: MatchLite[],
  tips: TipLite[],
  now: Date = new Date(),
): number {
  // Tipps nach match_id für schnellen Lookup
  const tipsByMatch = new Map<string, TipLite[]>();
  for (const t of tips) {
    if (!team.member_profile_ids.includes(t.profile_id)) continue;
    const arr = tipsByMatch.get(t.match_id) ?? [];
    arr.push(t);
    tipsByMatch.set(t.match_id, arr);
  }

  let count = 0;

  // 1..6: Gruppenspiele
  const groupMatches = matches
    .filter((m) => m.round === "group")
    .sort(
      (a, b) =>
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime(),
    )
    .slice(0, 6);

  for (const m of groupMatches) {
    const teamTipsForMatch = tipsByMatch.get(m.id) ?? [];
    if (teamTipsForMatch.some((t) => t.points_earned >= 3)) {
      count += 1;
    }
  }

  // 7: erste Achtelfinal-Begegnung angesetzt
  if (hasAnyScheduled(matches, "r16", now)) count += 1;
  // 8: erste Viertelfinal-Begegnung angesetzt
  if (hasAnyScheduled(matches, "qf", now)) count += 1;
  // 9: erste Halbfinal-Begegnung angesetzt
  if (hasAnyScheduled(matches, "sf", now)) count += 1;

  return Math.min(count, 9);
}

function hasAnyScheduled(
  matches: MatchLite[],
  round: Round,
  now: Date,
): boolean {
  return matches.some(
    (m) =>
      m.round === round &&
      m.match_date && // gesetzt = ausgelost
      new Date(m.match_date).getTime() <= now.getTime() + 7 * 24 * 60 * 60 * 1000, // innerhalb der nächsten Woche oder bereits vorbei
  );
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
