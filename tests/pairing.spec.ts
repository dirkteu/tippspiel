import { describe, it, expect } from "vitest";
import { generatePairings, canDerange, type RosterPlayer } from "@/lib/pairing";

function player(id: string, gender: "m" | "f", partnerId: string | null = null): RosterPlayer {
  return { id, real_name: id, gender, real_partner_id: partnerId };
}

describe("generatePairings", () => {
  it("leerer Roster → leeres Ergebnis", () => {
    expect(generatePairings([])).toEqual([]);
  });

  it("wirft bei ungleicher Anzahl Männer/Frauen", () => {
    expect(() =>
      generatePairings([player("m1", "m"), player("m2", "m"), player("f1", "f")]),
    ).toThrow();
  });

  it("paart 2 Männer + 2 Frauen ohne Constraints zufällig", () => {
    const result = generatePairings([
      player("m1", "m"),
      player("m2", "m"),
      player("f1", "f"),
      player("f2", "f"),
    ]);
    expect(result.length).toBe(2);
    expect(result.every((p) => p.male.gender === "m" && p.female.gender === "f")).toBe(true);
  });

  it("respektiert real_partner_id: Dirk/Anja + Peter/Uta", () => {
    // Dirk↔Anja, Peter↔Uta sind echte Paare
    const dirk = player("m1", "m", "f1");
    const anja = player("f1", "f", "m1");
    const peter = player("m2", "m", "f2");
    const uta = player("f2", "f", "m2");
    // 50 zufällige Läufe — kein einziger darf ein echtes Paar enthalten
    for (let i = 0; i < 50; i++) {
      const result = generatePairings([dirk, anja, peter, uta]);
      expect(result.length).toBe(2);
      for (const pair of result) {
        expect(pair.male.real_partner_id).not.toBe(pair.female.id);
      }
    }
  });

  it("wirft bei 1v1 mit echtem Paar (kein Derangement möglich)", () => {
    const a = player("m1", "m", "f1");
    const b = player("f1", "f", "m1");
    expect(() => generatePairings([a, b])).toThrow();
  });

  it("löst 1v1 ohne echtes Paar trivial", () => {
    const a = player("m1", "m", null);
    const b = player("f1", "f", null);
    const result = generatePairings([a, b]);
    expect(result).toEqual([{ male: a, female: b }]);
  });

  it("Property-based: 100 zufällige Roster — niemand mit echtem Partner gepaart", () => {
    for (let n = 2; n <= 8; n++) {
      // n Paare ⇒ 2n Personen
      const males: RosterPlayer[] = [];
      const females: RosterPlayer[] = [];
      for (let i = 0; i < n; i++) {
        const mId = `m${i}`;
        const fId = `f${i}`;
        males.push(player(mId, "m", fId));
        females.push(player(fId, "f", mId));
      }
      const roster = [...males, ...females];
      // 10 Versuche pro n
      for (let r = 0; r < 10; r++) {
        const result = generatePairings(roster);
        expect(result.length).toBe(n);
        for (const pair of result) {
          expect(pair.male.real_partner_id).not.toBe(pair.female.id);
          expect(pair.female.real_partner_id).not.toBe(pair.male.id);
        }
        // Jeder Mann + jede Frau genau einmal verwendet
        const maleIds = new Set(result.map((p) => p.male.id));
        const femaleIds = new Set(result.map((p) => p.female.id));
        expect(maleIds.size).toBe(n);
        expect(femaleIds.size).toBe(n);
      }
    }
  });
});

describe("canDerange", () => {
  it("leerer Roster geht", () => {
    expect(canDerange([])).toBe(true);
  });
  it("1v1 mit echtem Paar geht nicht", () => {
    expect(canDerange([player("m1", "m", "f1"), player("f1", "f", "m1")])).toBe(false);
  });
  it("1v1 ohne echtes Paar geht", () => {
    expect(canDerange([player("m1", "m"), player("f1", "f")])).toBe(true);
  });
  it("ungleiche Anzahl geht nicht", () => {
    expect(canDerange([player("m1", "m"), player("m2", "m"), player("f1", "f")])).toBe(false);
  });
});
