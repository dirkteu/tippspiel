import { describe, it, expect } from "vitest";
import {
  tilesUnlocked,
  openTilePositions,
  type MatchLite,
  type TipLite,
  type TeamLite,
} from "@/lib/tiles";

const team: TeamLite = { member_profile_ids: ["m1", "f1"] };

function makeGroupMatch(id: string, day: number): MatchLite {
  return {
    id,
    round: "group",
    match_date: `2026-06-${String(day).padStart(2, "0")}T18:00:00Z`,
  };
}

const sixGroupMatches: MatchLite[] = [1, 2, 3, 4, 5, 6].map((d) =>
  makeGroupMatch(`g${d}`, 10 + d),
);

describe("tilesUnlocked", () => {
  it("0 Kacheln zu Beginn (keine Spiele gewertet, keine K.o. angesetzt)", () => {
    expect(tilesUnlocked(team, sixGroupMatches, [], new Date("2026-06-01"))).toBe(0);
  });

  it("1 Kachel nach Volltreffer (≥3 Punkte) eines Mitglieds", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 3 },
    ];
    expect(tilesUnlocked(team, sixGroupMatches, tips, new Date("2026-06-15"))).toBe(1);
  });

  it("kein Kachel-Reveal bei <3 Punkten", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 2 },
      { match_id: "g2", profile_id: "f1", points_earned: 0 },
    ];
    expect(tilesUnlocked(team, sixGroupMatches, tips, new Date("2026-06-15"))).toBe(0);
  });

  it("Partner-Volltreffer zählt auch", () => {
    const tips: TipLite[] = [
      { match_id: "g3", profile_id: "f1", points_earned: 4 },
    ];
    expect(tilesUnlocked(team, sixGroupMatches, tips, new Date("2026-06-15"))).toBe(1);
  });

  it("alle 6 Gruppen-Kacheln bei 6 Volltreffern", () => {
    const tips: TipLite[] = sixGroupMatches.map((m) => ({
      match_id: m.id,
      profile_id: "m1",
      points_earned: 4,
    }));
    expect(tilesUnlocked(team, sixGroupMatches, tips, new Date("2026-06-20"))).toBe(6);
  });

  it("nicht doppelt zählen, wenn beide Mitglieder im selben Spiel Volltreffer", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "m1", points_earned: 4 },
      { match_id: "g1", profile_id: "f1", points_earned: 3 },
    ];
    expect(tilesUnlocked(team, sixGroupMatches, tips, new Date("2026-06-15"))).toBe(1);
  });

  it("ignoriert Tipps von fremden Profilen", () => {
    const tips: TipLite[] = [
      { match_id: "g1", profile_id: "fremder", points_earned: 4 },
    ];
    expect(tilesUnlocked(team, sixGroupMatches, tips, new Date("2026-06-15"))).toBe(0);
  });

  it("Kachel 7 fällt sobald ein r16-Spiel angesetzt ist", () => {
    const matches: MatchLite[] = [
      ...sixGroupMatches,
      { id: "r16-1", round: "r16", match_date: "2026-06-29T18:00:00Z" },
    ];
    expect(tilesUnlocked(team, matches, [], new Date("2026-06-28"))).toBe(1);
  });

  it("Kacheln 7+8+9 fallen mit r16, qf, sf-Ansetzung", () => {
    const matches: MatchLite[] = [
      ...sixGroupMatches,
      { id: "r16-1", round: "r16", match_date: "2026-06-29T18:00:00Z" },
      { id: "qf-1", round: "qf", match_date: "2026-07-04T18:00:00Z" },
      { id: "sf-1", round: "sf", match_date: "2026-07-08T18:00:00Z" },
    ];
    expect(tilesUnlocked(team, matches, [], new Date("2026-07-07"))).toBe(3);
  });

  it("Volle 9 Kacheln im Idealfall", () => {
    const tips: TipLite[] = sixGroupMatches.map((m) => ({
      match_id: m.id,
      profile_id: "f1",
      points_earned: 4,
    }));
    const matches: MatchLite[] = [
      ...sixGroupMatches,
      { id: "r16-1", round: "r16", match_date: "2026-06-29T18:00:00Z" },
      { id: "qf-1", round: "qf", match_date: "2026-07-04T18:00:00Z" },
      { id: "sf-1", round: "sf", match_date: "2026-07-08T18:00:00Z" },
    ];
    expect(tilesUnlocked(team, matches, tips, new Date("2026-07-07"))).toBe(9);
  });

  it("Capped bei 9 auch wenn rechnerisch mehr", () => {
    // Synthetisch unmöglicher Fall: zur Sicherheit getestet
    const tips: TipLite[] = sixGroupMatches.map((m) => ({
      match_id: m.id,
      profile_id: "m1",
      points_earned: 4,
    }));
    const matches: MatchLite[] = [
      ...sixGroupMatches,
      { id: "r16-1", round: "r16", match_date: "2026-06-29T18:00:00Z" },
      { id: "r16-2", round: "r16", match_date: "2026-06-30T18:00:00Z" },
      { id: "qf-1", round: "qf", match_date: "2026-07-04T18:00:00Z" },
      { id: "sf-1", round: "sf", match_date: "2026-07-08T18:00:00Z" },
    ];
    expect(tilesUnlocked(team, matches, tips, new Date("2026-07-07"))).toBe(9);
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
