// Verbindet direkt per pg zur Supabase-Postgres-Instanz und appliziert
// supabase/migrations/0099_apply_all.sql mit voller Ausgabe pro Statement.
import { readFileSync } from "node:fs";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

if (!env.DATABASE_URL) throw new Error("DATABASE_URL fehlt in .env.local");

const sql = readFileSync("supabase/migrations/0099_apply_all.sql", "utf8");

const client = new pg.Client({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("✅ Verbunden zu db.lxrofutyghzommmeyvez.supabase.co");

try {
  const res = await client.query(sql);
  // Bei mehreren Statements ist res ein Array
  const results = Array.isArray(res) ? res : [res];
  console.log(`✅ ${results.length} Statement-Ergebnisse zurück`);
  for (const r of results) {
    if (r.command) console.log(`   ${r.command} → ${r.rowCount ?? 0} Zeilen`);
  }
} catch (e) {
  console.error("❌ Fehler bei Migration:", e.message);
  console.error("   Position:", e.position);
  console.error("   Detail:", e.detail);
  process.exit(1);
} finally {
  await client.end();
}

console.log("Fertig.");
