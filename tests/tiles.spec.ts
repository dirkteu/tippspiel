import { describe, it, expect } from "vitest";
import {
  tilesUnlocked,
  openTilePositions,
  type MatchLite,
  type TipLite,
  type TeamLite,
} from "@/lib/tiles";

const team: TeamLite = { member_profile_ids: ["m1", "f1"] };

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

describe("tilesUnlocked", () => {
  it("0 Kacheln zu Beginn (keine Spiele gewertet, keine Tipps)", () => {
    expect(tilesUnlocked(team, sixGroupMatchesUnplayed, [])).toBe(0);
  });

  it("1 Kachel nach erstem gewerteten Vorrundenspiel (Basis allein)", () => {
    const matches: MatchLite[] = [
      makeGroupMatch("g1", 11, { result_1: 2, result_2: 1 }),
      ...sixGroupMatchesUnplayed.slice(1),
    ];
    expect(tilesUnlocked(team, matches, [])).toBe(1);
  });

  it("2 Kacheln: gewertetes Spiel + Volltreffer eines Mitglieds (kumulativ)", () => {
    const matches: MatchLite[] = [
      makeGroupMatch("g1", 11, { result_1: 2, result_2: 1 }),
      ...sixGroupMatchesUnplayed.slice(1),
    ];
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 3 },
    ];
    expect(tilesUnlocked(team, matches, tips)).toBe(2);
  });

  it("Partner-Volltreffer (f1) zaehlt ebenfalls als Bonus", () => {
    const matches: MatchLite[] = [
      ...sixGroupMatchesUnplayed.slice(0, 2),
      makeGroupMatch("g3", 13, { result_1: 0, result_2: 0 }),
      ...sixGroupMatchesUnplayed.slice(3),
    ];
    const tips: TipLite[] = [
      { match_id: "g3", profile_id: "f1", points_earned: 4 },
    ];
    // g3 ist gewertet → 1 Basis + 1 Bonus = 2
    expect(tilesUnlocked(team, matches, tips)).toBe(2);
  });

  it("Volltreffer in ungewertetem Spiel: Bonus zaehlt trotzdem", () => {
    // Hypothetisch — in der Praxis koennte das nicht vorkommen, weil
    // points_earned erst beim Wertungs-Sync gesetzt wird. Aber Logik
    // sollte unabhaengig vom Match-Status korrekt funktionieren.
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 5 },
    ];
    expect(tilesUnlocked(team, sixGroupMatchesUnplayed, tips)).toBe(1);
  });

  it("kein Bonus bei <3 Punkten", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 2 },
      { match_id: "g2", profile_id: "f1", points_earned: 0 },
    ];
    expect(tilesUnlocked(team, sixGroupMatchesUnplayed, tips)).toBe(0);
  });

  it("6 Basis-Kacheln, wenn alle 6 Vorrundenspiele gewertet ohne Volltreffer", () => {
    expect(tilesUnlocked(team, sixGroupMatchesPlayed, [])).toBe(6);
  });

  it("Cap bei 9: 6 gewertete Spiele + 3 Volltreffer = 9", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 4 },
      { match_id: "g2", profile_id: "f1", points_earned: 3 },
      { match_id: "g3", profile_id: "m1", points_earned: 5 },
    ];
    expect(tilesUnlocked(team, sixGroupMatchesPlayed, tips)).toBe(9);
  });

  it("Cap bei 9: 6 gewertete + 6 Volltreffer = 9 (gedeckelt)", () => {
    const tips: TipLite[] = sixGroupMatchesPlayed.map((m) => ({
      match_id: m.id,
      profile_id: "m1",
      points_earned: 4,
    }));
    expect(tilesUnlocked(team, sixGroupMatchesPlayed, tips)).toBe(9);
  });

  it("doppelter Volltreffer (m + f) im selben Match = nur 1 Bonus", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 4 },
      { match_id: "g1", profile_id: "f1", points_earned: 3 },
    ];
    // g1 ungespielt → Basis 0 + Bonus 1 = 1
    expect(tilesUnlocked(team, sixGroupMatchesUnplayed, tips)).toBe(1);
  });

  it("Volltreffer ausserhalb der ersten 6 Vorrundenspiele zaehlt trotzdem als Bonus", () => {
    const matches: MatchLite[] = [
      ...sixGroupMatchesUnplayed,
      makeGroupMatch("g7", 20, { result_1: 1, result_2: 2 }),
    ];
    const tips: TipLite[] = [
      { match_id: "g7", profile_id: "m1", points_earned: 4 },
    ];
    // Basis: 0 (g7 ist 7. chronologisch, ausserhalb der ersten 6)
    // Bonus: 1 (Vorrundenspiel mit Volltreffer)
    expect(tilesUnlocked(team, matches, tips)).toBe(1);
  });

  it("KO-Spiele zaehlen NICHT — weder als Basis noch als Bonus", () => {
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
      {
        id: "sf-1",
        round: "sf",
        match_date: "2026-07-08T18:00:00Z",
        result_1: null,
        result_2: null,
      },
    ];
    const tips: TipLite[] = [
      { match_id: "r16-1", profile_id: "m1", points_earned: 4 },
      { match_id: "qf-1", profile_id: "f1", points_earned: 3 },
    ];
    expect(tilesUnlocked(team, matches, tips)).toBe(0);
  });

  it("ignoriert Tipps von fremden Profilen", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "fremder", points_earned: 4 },
    ];
    expect(tilesUnlocked(team, sixGroupMatchesUnplayed, tips)).toBe(0);
  });

  it("ignoriert Tipps auf nicht-existente Match-IDs", () => {
    const tips: TipLite[] = [
      { match_id: "ghost", profile_id: "m1", points_earned: 4 },
    ];
    expect(tilesUnlocked(team, sixGroupMatchesUnplayed, tips)).toBe(0);
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
