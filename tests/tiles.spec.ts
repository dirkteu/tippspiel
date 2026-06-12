import { describe, it, expect } from "vitest";
import {
  tilesUnlocked,
  openTilePositions,
  type MatchLite,
  type TipLite,
} from "@/lib/tiles";

// "m1" = Dirk, "f1" = Alex (Team-Mitglieder). Berechnung erfolgt pro Spieler.

function makeGroupMatch(
  id: string,
  day: number,
  played: { result_1: number; result_2: number } | null = null,
): MatchLite {
  return {
    id,
    round: "group",
    match_date: `2026-06-${String(day).padStart(2, "0")}T18:00:00Z`,
    result_1: played?.result_1 ?? null,
    result_2: played?.result_2 ?? null,
  };
}

const sixGroupMatchesUnplayed: MatchLite[] = [1, 2, 3, 4, 5, 6].map((d) =>
  makeGroupMatch(`g${d}`, 10 + d),
);

const sixGroupMatchesPlayed: MatchLite[] = [1, 2, 3, 4, 5, 6].map((d) =>
  makeGroupMatch(`g${d}`, 10 + d, { result_1: 1, result_2: 0 }),
);

describe("tilesUnlocked (pro Spieler)", () => {
  it("0 Kacheln zu Beginn (keine Spiele gewertet, keine Tipps)", () => {
    expect(tilesUnlocked("m1", sixGroupMatchesUnplayed, [])).toBe(0);
  });

  it("1 Kachel nach erstem gewerteten Vorrundenspiel (Basis allein)", () => {
    const matches: MatchLite[] = [
      makeGroupMatch("g1", 11, { result_1: 2, result_2: 1 }),
      ...sixGroupMatchesUnplayed.slice(1),
    ];
    expect(tilesUnlocked("m1", matches, [])).toBe(1);
  });

  it("2 Kacheln: gewertetes Spiel + eigener Volltreffer (kumulativ)", () => {
    const matches: MatchLite[] = [
      makeGroupMatch("g1", 11, { result_1: 2, result_2: 1 }),
      ...sixGroupMatchesUnplayed.slice(1),
    ];
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 3 },
    ];
    expect(tilesUnlocked("m1", matches, tips)).toBe(2);
  });

  it("Volltreffer des Partners zaehlt NICHT fuer mich", () => {
    // Alex (f1) hat Volltreffer, Dirk (m1) nicht. Dirk sieht nur die Basis.
    const matches: MatchLite[] = [
      makeGroupMatch("g1", 11, { result_1: 2, result_2: 1 }),
      ...sixGroupMatchesUnplayed.slice(1),
    ];
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "f1", points_earned: 4 },
      { match_id: "g1", profile_id: "m1", points_earned: 1 },
    ];
    expect(tilesUnlocked("m1", matches, tips)).toBe(1); // Dirk: nur Basis
    expect(tilesUnlocked("f1", matches, tips)).toBe(2); // Alex: Basis + Bonus
  });

  it("Volltreffer in ungewertetem Spiel: Bonus zaehlt trotzdem (Edge-Case)", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 5 },
    ];
    expect(tilesUnlocked("m1", sixGroupMatchesUnplayed, tips)).toBe(1);
  });

  it("kein Bonus bei <3 Punkten", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 2 },
      { match_id: "g2", profile_id: "m1", points_earned: 0 },
    ];
    expect(tilesUnlocked("m1", sixGroupMatchesUnplayed, tips)).toBe(0);
  });

  it("6 Basis-Kacheln, wenn alle 6 Vorrundenspiele gewertet ohne Volltreffer", () => {
    expect(tilesUnlocked("m1", sixGroupMatchesPlayed, [])).toBe(6);
  });

  it("Cap bei 9: 6 gewertete Spiele + 3 eigene Volltreffer = 9", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 4 },
      { match_id: "g2", profile_id: "m1", points_earned: 3 },
      { match_id: "g3", profile_id: "m1", points_earned: 5 },
    ];
    expect(tilesUnlocked("m1", sixGroupMatchesPlayed, tips)).toBe(9);
  });

  it("Cap bei 9: 6 gewertete + 6 eigene Volltreffer = 9 (gedeckelt)", () => {
    const tips: TipLite[] = sixGroupMatchesPlayed.map((m) => ({
      match_id: m.id,
      profile_id: "m1",
      points_earned: 4,
    }));
    expect(tilesUnlocked("m1", sixGroupMatchesPlayed, tips)).toBe(9);
  });

  it("Mehrere eigene Volltreffer im selben Match (theoretisch) zaehlen nur einmal", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 4 },
      { match_id: "g1", profile_id: "m1", points_earned: 5 },
    ];
    // g1 ungespielt → Basis 0 + Bonus 1 (Set-Dedupe) = 1
    expect(tilesUnlocked("m1", sixGroupMatchesUnplayed, tips)).toBe(1);
  });

  it("Eigener Volltreffer ausserhalb der ersten 6 Vorrundenspiele zaehlt trotzdem", () => {
    const matches: MatchLite[] = [
      ...sixGroupMatchesUnplayed,
      makeGroupMatch("g7", 20, { result_1: 1, result_2: 2 }),
    ];
    const tips: TipLite[] = [
      { match_id: "g7", profile_id: "m1", points_earned: 4 },
    ];
    expect(tilesUnlocked("m1", matches, tips)).toBe(1);
  });

  it("KO-Spiele zaehlen NICHT als Basis, aber Volltreffer dort als Bonus", () => {
    const matches: MatchLite[] = [
      ...sixGroupMatchesUnplayed,
      {
        id: "r16-1",
        round: "r16",
        match_date: "2026-06-29T18:00:00Z",
        result_1: 2,
        result_2: 1,
      },
      {
        id: "qf-1",
        round: "qf",
        match_date: "2026-07-04T18:00:00Z",
        result_1: 3,
        result_2: 0,
      },
    ];
    const tips: TipLite[] = [
      { match_id: "r16-1", profile_id: "m1", points_earned: 4 },
      { match_id: "qf-1", profile_id: "m1", points_earned: 3 },
      { match_id: "r16-1", profile_id: "f1", points_earned: 2 }, // kein Volltreffer
    ];
    // Basis 0 (KO-Ergebnisse zaehlen nicht als Basis) + 2 eigene KO-Volltreffer
    expect(tilesUnlocked("m1", matches, tips)).toBe(2);
    expect(tilesUnlocked("f1", matches, tips)).toBe(0);
  });

  it("Cap bei 9 gilt auch mit KO-Volltreffern", () => {
    const koMatches: MatchLite[] = ["r32-1", "r16-1", "qf-1", "sf-1"].map((id, i) => ({
      id,
      round: ["r32", "r16", "qf", "sf"][i] as MatchLite["round"],
      match_date: `2026-07-${String(i + 1).padStart(2, "0")}T18:00:00Z`,
      result_1: 1,
      result_2: 0,
    }));
    const tips: TipLite[] = [
      ...sixGroupMatchesPlayed.map((m) => ({
        match_id: m.id,
        profile_id: "m1",
        points_earned: 4,
      })),
      ...koMatches.map((m) => ({
        match_id: m.id,
        profile_id: "m1",
        points_earned: 4,
      })),
    ];
    expect(
      tilesUnlocked("m1", [...sixGroupMatchesPlayed, ...koMatches], tips),
    ).toBe(9);
  });

  it("ignoriert Tipps von Drittprofilen", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "fremder", points_earned: 4 },
    ];
    expect(tilesUnlocked("m1", sixGroupMatchesUnplayed, tips)).toBe(0);
  });

  it("ignoriert Tipps auf nicht-existente Match-IDs", () => {
    const tips: TipLite[] = [
      { match_id: "ghost", profile_id: "m1", points_earned: 4 },
    ];
    expect(tilesUnlocked("m1", sixGroupMatchesUnplayed, tips)).toBe(0);
  });
});

describe("openTilePositions", () => {
  it("liefert leeres Set bei 0 gefallenen Kacheln", () => {
    expect(openTilePositions([4, 6, 2, 8, 1, 9, 3, 7, 5], 0).size).toBe(0);
  });

  it("liefert die ersten N Positionen aus der Reihenfolge (0-basiert)", () => {
    const open = openTilePositions([4, 6, 2, 8, 1, 9, 3, 7, 5], 3);
    expect(open).toEqual(new Set([3, 5, 1])); // 4-1, 6-1, 2-1
  });

  it("alle 9 offen", () => {
    expect(openTilePositions([1, 2, 3, 4, 5, 6, 7, 8, 9], 9)).toEqual(
      new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]),
    );
  });
});
