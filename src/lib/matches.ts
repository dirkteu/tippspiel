import "server-only";
import { supabaseService } from "@/lib/supabase/server";

export interface MatchRow {
  id: string;
  group_name: string;
  round: "group" | "r32" | "r16" | "qf" | "sf" | "3rd" | "final";
  team_1: string;
  team_2: string;
  flag_1: string | null;
  flag_2: string | null;
  match_date: string;
  locked_at: string;
  stadium: string | null;
  result_1: number | null;
  result_2: number | null;
}

const ROUND_LABEL: Record<MatchRow["round"], string> = {
  group: "Gruppe",
  r32: "Sechzehntelfinale",
  r16: "Achtelfinale",
  qf: "Viertelfinale",
  sf: "Halbfinale",
  "3rd": "Spiel um Platz 3",
  final: "Finale",
};

export function roundLabel(m: Pick<MatchRow, "round" | "group_name" | "match_date">): string {
  const base = m.round === "group" ? m.group_name : ROUND_LABEL[m.round];
  const d = new Date(m.match_date);
  const date = d.toLocaleDateString("de-DE", { day: "numeric", month: "long", timeZone: "Europe/Berlin" });
  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
  return `${base} · ${date} · ${time}`;
}

/** Strukturierte Variante für UI mit Bold-Anteilen. */
export function matchHeading(m: Pick<MatchRow, "round" | "group_name" | "match_date">): {
  meta_primary: string;
  meta_secondary: string;
} {
  const primary = m.round === "group" ? (m.group_name ?? "") : ROUND_LABEL[m.round];
  const d = new Date(m.match_date);
  const date = d.toLocaleDateString("de-DE", { day: "numeric", month: "long", timeZone: "Europe/Berlin" });
  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
  return { meta_primary: primary, meta_secondary: `${date} · ${time} Uhr` };
}

export async function fetchAllMatches(): Promise<MatchRow[]> {
  const sb = supabaseService();
  const { data, error } = await sb
    .from("matches")
    .select("*")
    .order("match_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MatchRow[];
}

export async function fetchTipsForProfile(profileId: string) {
  const sb = supabaseService();
  const { data, error } = await sb
    .from("tips")
    .select("match_id,profile_id,tip_1,tip_2,points_earned,updated_at")
    .eq("profile_id", profileId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchTipsForTeam(teamMemberIds: string[]) {
  const sb = supabaseService();
  if (teamMemberIds.length === 0) return [];
  const { data, error } = await sb
    .from("tips")
    .select("match_id,profile_id,tip_1,tip_2,points_earned")
    .in("profile_id", teamMemberIds);
  if (error) throw error;
  return data ?? [];
}

/**
 * Alle Tipps (paginiert). Ein einzelnes select() ist bei PostgREST auf 1000
 * Zeilen (max-rows) gedeckelt — bei mehr Tipps fiele die Punktesumme in den
 * Ranglisten zu niedrig aus. Deshalb blockweise über .range() alles holen.
 */
export async function fetchAllTips(): Promise<
  { profile_id: string; match_id: string; points_earned: number }[]
> {
  const sb = supabaseService();
  const pageSize = 1000;
  const all: { profile_id: string; match_id: string; points_earned: number }[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from("tips")
      .select("profile_id,match_id,points_earned")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

export async function fetchTeamMemberIds(teamId: string): Promise<string[]> {
  const sb = supabaseService();
  const { data, error } = await sb
    .from("profiles")
    .select("id")
    .eq("team_id", teamId);
  if (error) throw error;
  return (data ?? []).map((p) => p.id);
}

/**
 * Tipp ist gesperrt wenn entweder die Sperrfrist (5 Min vor Anpfiff)
 * überschritten ist ODER beide Ergebnisse bereits eingetragen sind.
 */
export function isLocked(
  m: Pick<MatchRow, "locked_at" | "result_1" | "result_2">,
  now: Date = new Date(),
): boolean {
  if (m.result_1 != null && m.result_2 != null) return true;
  return new Date(m.locked_at).getTime() <= now.getTime();
}
