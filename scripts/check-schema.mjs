// Prüft, ob Spalten, Trigger und Storage-Bucket aus den Migrationen vorhanden sind.
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

async function check(label, fn) {
  try {
    const ok = await fn();
    console.log(`${ok ? "✅" : "⚠️ "} ${label}`);
  } catch (e) {
    console.log(`❌ ${label}: ${e.message}`);
  }
}

await check("teams.tile_order existiert", async () => {
  const { data, error } = await sb.from("teams").select("id,tile_order").limit(1);
  if (error) throw new Error(error.message + " (code=" + error.code + ")");
  return true;
});

await check("matches.round existiert", async () => {
  const { error } = await sb.from("matches").select("id,round").limit(1);
  if (error) throw new Error(error.message);
  return true;
});

await check("matches.locked_at existiert", async () => {
  const { error } = await sb.from("matches").select("id,locked_at").limit(1);
  if (error) throw new Error(error.message);
  return true;
});

await check("matches.api_fixture_id existiert", async () => {
  const { error } = await sb.from("matches").select("id,api_fixture_id").limit(1);
  if (error) throw new Error(error.message);
  return true;
});

await check("matches.flag_1/flag_2 existieren", async () => {
  const { error } = await sb.from("matches").select("id,flag_1,flag_2").limit(1);
  if (error) throw new Error(error.message);
  return true;
});

await check("tournament_config Initial-Row (id=1) vorhanden", async () => {
  const { data, error } = await sb
    .from("tournament_config")
    .select("id,champion_lock_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
});

await check("Storage-Bucket 'avatars' existiert", async () => {
  const { data, error } = await sb.storage.getBucket("avatars");
  if (error) throw new Error(error.message);
  return !!data;
});

await check("Team-Insert + tile_order Auto-Default", async () => {
  const suffix = Date.now();
  const { data, error } = await sb
    .from("teams")
    .insert({
      invite_code_male: "CHK_M_" + suffix,
      invite_code_female: "CHK_F_" + suffix,
    })
    .select("id,tile_order")
    .single();
  if (error) throw new Error(error.message);
  const ok = Array.isArray(data.tile_order) && data.tile_order.length === 9;
  await sb.from("teams").delete().eq("id", data.id);
  return ok;
});

console.log("\nFertig.");
