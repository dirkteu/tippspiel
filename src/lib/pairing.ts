/**
 * Roster-Pairing für Secret Squad.
 *
 * Zieht zufällige Mann-Frau-Paarungen aus dem Roster, wobei kein Mann
 * mit seiner echten Lebenspartnerin (real_partner_id) im selben Spielteam
 * landet. Klassisches Derangement-Problem.
 */

export interface RosterPlayer {
  id: string;
  real_name: string | null;
  gender: "m" | "f";
  real_partner_id: string | null;
}

export interface PairingResult {
  male: RosterPlayer;
  female: RosterPlayer;
}

/**
 * Liefert N Paarungen ohne Real-Partner-Match.
 *
 * @throws wenn Männer- und Frauen-Anzahl nicht gleich sind oder kein Derangement existiert
 */
export function generatePairings(roster: RosterPlayer[]): PairingResult[] {
  const males = roster.filter((p) => p.gender === "m");
  const females = roster.filter((p) => p.gender === "f");

  if (males.length !== females.length) {
    throw new Error(
      `Anzahl ungleich: ${males.length} Männer vs. ${females.length} Frauen`,
    );
  }
  if (males.length === 0) {
    return [];
  }

  // Bis zu 1000 Versuche Fisher-Yates-Shuffle, bis Constraint erfüllt ist.
  for (let attempt = 0; attempt < 1000; attempt++) {
    const shuffled = fisherYates([...females]);
    const valid = males.every((m, i) => m.real_partner_id !== shuffled[i].id);
    if (valid) {
      return males.map((m, i) => ({ male: m, female: shuffled[i] }));
    }
  }
  throw new Error(
    "Nach 1000 Versuchen keine gültige Paarung gefunden — vermutlich unmöglich (z.B. nur 1 Paar das echt ist)",
  );
}

function fisherYates<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Prüft, ob ein Derangement theoretisch möglich ist.
 * Trivial-Check: bei nur 1 Mann + 1 Frau, die echte Partner sind → unmöglich.
 */
export function canDerange(roster: RosterPlayer[]): boolean {
  const males = roster.filter((p) => p.gender === "m");
  const females = roster.filter((p) => p.gender === "f");
  if (males.length !== females.length) return false;
  if (males.length === 0) return true;
  if (males.length === 1) {
    // Einzelnes Paar geht nur, wenn sie KEIN echtes Paar sind
    return males[0].real_partner_id !== females[0].id;
  }
  // Ab 2+ Männern: prinzipiell immer ein Derangement möglich,
  // außer alle Frauen sind dieselbe Real-Partnerin — algorithmisch via Versuch erkennen.
  return true;
}
