// Pollt die PostgREST OpenAPI-Spec und listet Tabellen+Spalten im public-Schema.
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

const res = await fetch(env.SUPABASE_URL + "/rest/v1/", {
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
  },
});
const spec = await res.json();
const defs = spec.definitions ?? {};

for (const name of Object.keys(defs).sort()) {
  const cols = Object.keys(defs[name].properties ?? {});
  console.log(`📋 ${name} (${cols.length} Spalten):`);
  console.log("   " + cols.join(", "));
}
