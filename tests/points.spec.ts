import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { calcPoints, isVolltreffer } from "@/lib/points";

describe("calcPoints", () => {
  it("4 Punkte für exaktes Ergebnis", () => {
    expect(calcPoints(2, 1, 2, 1)).toBe(4);
    expect(calcPoints(0, 0, 0, 0)).toBe(4);
    expect(calcPoints(3, 3, 3, 3)).toBe(4);
  });

  it("3 Punkte für richtige Tordifferenz", () => {
    expect(calcPoints(2, 1, 3, 2)).toBe(3); // beide +1
    expect(calcPoints(3, 1, 4, 2)).toBe(3); // beide +2
    expect(calcPoints(1, 1, 2, 2)).toBe(3); // beide 0 (Unentschieden, andere Höhe)
  });

  it("2 Punkte für richtige Tendenz", () => {
    expect(calcPoints(2, 1, 3, 1)).toBe(2); // Heimsieg, andere Diff (+1 vs +2)
    expect(calcPoints(1, 3, 0, 3)).toBe(2); // Auswärtssieg, andere Diff (-2 vs -3)
  });

  it("0 Punkte für falsche Tendenz", () => {
    expect(calcPoints(2, 1, 0, 1)).toBe(0); // Heimsieg getippt, Auswärtssieg
    expect(calcPoints(1, 1, 2, 0)).toBe(0); // Unentschieden, Heimsieg
    expect(calcPoints(0, 2, 1, 1)).toBe(0); // Auswärtssieg, Unentschieden
  });

  it("0 Punkte bei fehlendem Ergebnis (null)", () => {
    expect(calcPoints(2, 1, null, null)).toBe(0);
    expect(calcPoints(2, 1, 2, null)).toBe(0);
    expect(calcPoints(2, 1, null, 1)).toBe(0);
  });

  it("Unentschieden 0:0 wird korrekt gewertet", () => {
    expect(calcPoints(0, 0, 1, 1)).toBe(3); // Unentschieden Tendenz + Diff korrekt
    expect(calcPoints(0, 0, 0, 0)).toBe(4);
  });

  // Property-based: keine Punkte-Inkonsistenzen über zufällige Eingaben
  it("ist konsistent: 4 ⇒ 3 ⇒ 2 (eine richtige Antwort schließt höhere Stufen ein)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (t1, t2, r1, r2) => {
          const p = calcPoints(t1, t2, r1, r2);
          // Wenn 4 Punkte, dann muss Diff stimmen und Tendenz stimmen
          if (p === 4) {
            expect(t1 - t2).toBe(r1 - r2);
            expect(Math.sign(t1 - t2)).toBe(Math.sign(r1 - r2));
          }
          // Wenn 3 Punkte, dann nicht exakt aber Diff stimmt
          if (p === 3) {
            expect(t1 === r1 && t2 === r2).toBe(false);
            expect(t1 - t2).toBe(r1 - r2);
          }
          // Wenn 2 Punkte, dann Tendenz stimmt aber Diff nicht
          if (p === 2) {
            expect(Math.sign(t1 - t2)).toBe(Math.sign(r1 - r2));
            expect(t1 - t2).not.toBe(r1 - r2);
          }
          // Wenn 0 Punkte, dann Tendenz falsch
          if (p === 0) {
            expect(Math.sign(t1 - t2)).not.toBe(Math.sign(r1 - r2));
          }
        },
      ),
      { numRuns: 1000 },
    );
  });
});

describe("isVolltreffer", () => {
  it("erkennt nur ≥3 Punkte als Volltreffer", () => {
    expect(isVolltreffer(4)).toBe(true);
    expect(isVolltreffer(3)).toBe(true);
    expect(isVolltreffer(2)).toBe(false);
    expect(isVolltreffer(0)).toBe(false);
  });
});
