/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Cron-Worker: pollt api-football.com im 5-Minuten-Takt und schickt
 * 90-Minuten-Ergebnisse zur internen /api/cron/sync-results.
 *
 * Wird als separater Container ausgeführt (siehe docker-compose.yml).
 */
import cron from "node-cron";

// Bracket-Notation: umgeht Build-Time-Inlining im Worker-tsc-Output.
const SITE_URL = process.env["NEXT_PUBLIC_SITE_URL"] ?? "http://web:3000";
const API_KEY = process.env["API_FOOTBALL_KEY"];
const CRON_SECRET = process.env["CRON_SECRET"];
const LEAGUE_ID = Number(process.env["API_FOOTBALL_LEAGUE_ID"] ?? 1); // 1 = World Cup
const SEASON = Number(process.env["API_FOOTBALL_SEASON"] ?? 2026);
const HEALTHCHECK_URL = process.env["HEALTHCHECK_URL"]; // optional

// Wenn keine API-Football-Credentials gesetzt sind: idle bleiben (kein Crash).
// Ergebnisse können dann manuell via Admin-Panel eingetragen werden.
if (!API_KEY || !CRON_SECRET) {
  console.warn(
    "[cron] API_FOOTBALL_KEY oder CRON_SECRET fehlt — Worker idle. Ergebnisse manuell pflegen.",
  );
  // Container am Leben halten ohne CPU zu verbraten
  setInterval(() => {}, 1 << 30);
}

async function pollOnce() {
  const today = new Date().toISOString().slice(0, 10);
  const url = `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}&date=${today}`;
  const res = await fetch(url, {
    headers: { "x-apisports-key": API_KEY! },
  });
  if (!res.ok) {
    console.error(`api-football ${res.status}`);
    return;
  }
  const json = (await res.json()) as { response: any[] };
  const updates: { api_fixture_id: number; result_1: number | null; result_2: number | null }[] = [];
  for (const fx of json.response ?? []) {
    const id = fx.fixture?.id;
    const status = fx.fixture?.status?.short as string | undefined;
    // FT = Full Time (90 Min ohne Verlängerung); auch live-Stände bei "2H"/"HT" mitnehmen
    const isFinal = status === "FT" || status === "AET" || status === "PEN";
    const goals = fx.score?.fulltime ?? fx.goals;
    if (id && isFinal && goals && typeof goals.home === "number" && typeof goals.away === "number") {
      updates.push({
        api_fixture_id: id,
        result_1: goals.home,
        result_2: goals.away,
      });
    }
  }
  if (updates.length === 0) return;
  const post = await fetch(`${SITE_URL}/api/cron/sync-results`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": CRON_SECRET!,
    },
    body: JSON.stringify({ updates }),
  });
  console.log("sync result", post.status, await post.text());
}

cron.schedule("*/5 * * * *", async () => {
  try {
    await pollOnce();
    if (HEALTHCHECK_URL) {
      await fetch(HEALTHCHECK_URL).catch(() => null);
    }
  } catch (e) {
    console.error("Cron-Lauf fehlgeschlagen", e);
  }
});

console.log("Bülser Alm Cron-Worker läuft (alle 5 Min)");
// Initial-Lauf nicht warten
pollOnce().catch(console.error);
