import "server-only";
import { cookies } from "next/headers";
import { supabaseService } from "@/lib/supabase/server";

export const LOGIN_TOKEN_COOKIE = "sq_login_token";

export interface AuthedSession {
  profile: {
    id: string;
    team_id: string;
    username: string;
    gender: "m" | "f";
    avatar_url: string | null;
    login_token: string;
  };
  team: {
    id: string;
    team_name: string | null;
    tile_order: number[];
  };
}

/**
 * Liest den login_token aus dem Cookie und liefert Profil + Team.
 * Liefert null, wenn nicht eingeloggt — Aufrufer entscheidet, ob umgeleitet wird.
 */
export async function getSession(): Promise<AuthedSession | null> {
  const c = await cookies();
  const token = c.get(LOGIN_TOKEN_COOKIE)?.value;
  if (!token) return null;
  return resolveToken(token);
}

export async function resolveToken(token: string): Promise<AuthedSession | null> {
  const sb = supabaseService();
  const { data: profile, error } = await sb
    .from("profiles")
    .select("id,team_id,username,gender,avatar_url,login_token")
    .eq("login_token", token)
    .maybeSingle();
  if (error || !profile) return null;
  const { data: team } = await sb
    .from("teams")
    .select("id,team_name,tile_order")
    .eq("id", profile.team_id)
    .maybeSingle();
  if (!team) return null;
  return { profile, team };
}

export function generateLoginToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export function generateInviteCode(): string {
  // 24 Zeichen hex aus zufälligen Bytes (96 bit Entropie)
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}
