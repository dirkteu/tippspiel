// Triggert PostgREST-Schema-Reload und liest Spalten direkt via REST-API
// (statt JS-Client, der cached).
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const URL = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Versuch 1: PostgREST über information_schema (separate Schemas brauchen Header)
async function listColumns(table) {
  const res = await fetch(
    `${URL}/rest/v1/columns?table_schema=eq.public&table_name=eq.${table}&select=column_name`,
    {
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${KEY}`,
        "Accept-Profile": "information_schema",
      },
    },
  );
  const json = await res.json();
  return { status: res.status, json };
}

// Versuch 2: List ALL buckets via Storage API
async function listBuckets() {
  const res = await fetch(`${URL}/storage/v1/bucket`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  return { status: res.status, json: await res.json() };
}

console.log("teams Spalten:", JSON.stringify(await listColumns("teams")));
console.log("matches Spalten:", JSON.stringify(await listColumns("matches")));
console.log("tournament_config Spalten:", JSON.stringify(await listColumns("tournament_config")));
console.log("Storage Buckets:", JSON.stringify(await listBuckets()));
