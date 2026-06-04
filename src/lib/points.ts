/**
 * Punkte-Wertung nach klassischem 4-3-2-System.
 * Quelle der Wahrheit; identisch zur PostgreSQL-Funktion calc_points() in 0003_points_trigger.sql.
 */
export function calcPoints(
  tip1: number,
  tip2: number,
  res1: number | null,
  res2: number | null,
): 0 | 2 | 3 | 4 {
  if (res1 === null || res2 === null) return 0;
  if (tip1 === res1 && tip2 === res2) return 4;
  if (tip1 - tip2 === res1 - res2) return 3;
  if (Math.sign(tip1 - tip2) === Math.sign(res1 - res2)) return 2;
  return 0;
}

/** "Volltreffer" = ≥3 Punkte = richtige Tordifferenz oder besser. */
export function isVolltreffer(points: number): boolean {
  return points >= 3;
}
