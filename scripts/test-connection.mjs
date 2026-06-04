// Smoke-Test: Supabase-Verbindung mit Service-Role-Key.
// Liest .env.local, fragt Tabellen ab, gibt nur Status aus — KEINE Credentials.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function ping(table) {
  const { error, count } = await sb
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) return `❌ ${table}: ${error.message}`;
  return `✅ ${table}: ${count ?? 0} Zeilen`;
}

const tables = ["teams", "profiles", "matches", "tips", "champion_tips", "tournament_config"];
for (const t of tables) {
  console.log(await ping(t));
}
