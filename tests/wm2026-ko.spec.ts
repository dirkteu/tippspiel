import { describe, it, expect } from "vitest";
import {
  KO_BRACKET,
  findKoMatch,
  koGroupName,
  koMatchLabel,
  type KoRound,
} from "@/lib/wm2026-ko";

describe("KO_BRACKET (WM 2026 Spielbaum)", () => {
  it("enthält genau 32 Spiele mit den Nummern 73–104", () => {
    expect(KO_BRACKET).toHaveLength(32);
    const nos = KO_BRACKET.map((m) => m.match_no).sort((a, b) => a - b);
    expect(nos).toEqual(Array.from({ length: 32 }, (_, i) => 73 + i));
  });

  it("hat die richtige Rundenverteilung 16/8/4/2/1/1", () => {
    const count = (r: KoRound) => KO_BRACKET.filter((m) => m.round === r).length;
    expect(count("r32")).toBe(16);
    expect(count("r16")).toBe(8);
    expect(count("qf")).toBe(4);
    expect(count("sf")).toBe(2);
    expect(count("3rd")).toBe(1);
    expect(count("final")).toBe(1);
  });

  it("alle Kickoffs sind gültige Daten mit CEST-Offset", () => {
    for (const m of KO_BRACKET) {
      expect(m.kickoff).toMatch(/\+02:00$/);
      expect(Number.isNaN(new Date(m.kickoff).getTime())).toBe(false);
    }
  });

  it("Runden überlappen zeitlich nicht (max. Runde N < min. Runde N+1)", () => {
    const order: KoRound[] = ["r32", "r16", "qf", "sf", "3rd", "final"];
    const times = (r: KoRound) =>
      KO_BRACKET.filter((m) => m.round === r).map((m) => new Date(m.kickoff).getTime());
    for (let i = 0; i < order.length - 1; i++) {
      expect(Math.max(...times(order[i]))).toBeLessThan(Math.min(...times(order[i + 1])));
    }
  });

  it("jede Sieger/Verlierer-Referenz zeigt auf ein existierendes Spiel der Vorrunde", () => {
    const prevRound: Record<string, KoRound | null> = {
      r16: "r32",
      qf: "r16",
      sf: "qf",
      "3rd": "sf",
      final: "sf",
    };
    for (const m of KO_BRACKET) {
      if (m.round === "r32") continue;
      for (const slot of [m.slot_1, m.slot_2]) {
        const ref = slot.match(/^(Sieger|Verlierer) Spiel (\d+)$/);
        expect(ref, `Slot "${slot}" in Spiel ${m.match_no}`).not.toBeNull();
        const target = findKoMatch(Number(ref![2]));
        expect(target, `Spiel ${ref![2]} referenziert von Spiel ${m.match_no}`).toBeDefined();
        expect(target!.round).toBe(prevRound[m.round]);
      }
    }
  });

  it("jedes Sechzehntelfinal-Spiel wird genau einmal im Achtelfinale fortgesetzt", () => {
    const referenced = KO_BRACKET.filter((m) => m.round === "r16")
      .flatMap((m) => [m.slot_1, m.slot_2])
      .map((s) => Number(s.replace("Sieger Spiel ", "")))
      .sort((a, b) => a - b);
    expect(referenced).toEqual(Array.from({ length: 16 }, (_, i) => 73 + i));
  });

  it("Deutschlands Pfad als Gruppensieger E: 74 → 89 → 97 → 101 → 104", () => {
    expect(findKoMatch(74)?.slot_1).toBe("1. Gruppe E");
    expect(findKoMatch(89)?.slot_1).toBe("Sieger Spiel 74");
    expect(findKoMatch(97)?.slot_1).toBe("Sieger Spiel 89");
    expect(findKoMatch(101)?.slot_1).toBe("Sieger Spiel 97");
    expect(findKoMatch(104)?.slot_1).toBe("Sieger Spiel 101");
  });

  it("Deutschlands Pfad als Gruppenzweiter E: 78 → 91 → 99 → 102", () => {
    expect(findKoMatch(78)?.slot_1).toBe("2. Gruppe E");
    expect(findKoMatch(91)?.slot_2).toBe("Sieger Spiel 78");
    expect(findKoMatch(99)?.slot_1).toBe("Sieger Spiel 91");
    expect(findKoMatch(102)?.slot_1).toBe("Sieger Spiel 99");
  });

  it("Label-Helper", () => {
    expect(koGroupName(74)).toBe("Spiel 74");
    expect(koMatchLabel(findKoMatch(74)!)).toBe("Spiel 74 · Sechzehntelfinale");
    expect(koMatchLabel(findKoMatch(104)!)).toBe("Spiel 104 · Finale");
  });
});
