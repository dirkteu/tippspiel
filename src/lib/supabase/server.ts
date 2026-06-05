import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "server-only";
import { readEnv } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Service-Role-Client. RLS wird umgangen.
 * NIEMALS aus Client-Components importieren — 'server-only' wirft Build-Fehler.
 */
export function supabaseService(): SupabaseClient {
  if (cached) return cached;
  const url = readEnv("SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen in .env gesetzt sein",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
