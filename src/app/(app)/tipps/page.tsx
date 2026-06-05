import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import {
  fetchAllMatches,
  fetchTipsForProfile,
  isLocked,
  roundLabel,
} from "@/lib/matches";
import { TippsClient, type TippsInitial } from "./TippsClient";

export default async function TippsPage() {
  const session = (await getSession())!;
  const sb = supabaseService();
  const [matches, tips, champRes, configRes] = await Promise.all([
    fetchAllMatches(),
    fetchTipsForProfile(session.profile.id),
    sb
      .from("champion_tips")
      .select("champion_team")
      .eq("profile_id", session.profile.id)
      .maybeSingle(),
    sb
      .from("tournament_config")
      .select("champion_lock_at")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const now = new Date();
  const tipsByMatch = new Map(tips.map((t) => [t.match_id, t]));

  const matchInfos = matches.map((m) => ({
    id: m.id,
    round_label: roundLabel(m),
    kickoff: m.match_date,
    team_1: m.team_1,
    team_2: m.team_2,
    flag_1: m.flag_1,
    flag_2: m.flag_2,
    stadium: m.stadium,
    locked: isLocked(m, now),
  }));

  const tipsObj: TippsInitial["tips"] = {};
  for (const m of matches) {
    const t = tipsByMatch.get(m.id);
    if (!t) continue;
    // Nur wenn das Spiel auch wirklich ein Ergebnis hat, ist points_earned
    // belastbar — sonst zeigt die UI fälschlich "Gewertet · 0 Pkt".
    const played = m.result_1 != null && m.result_2 != null;
    tipsObj[m.id] = {
      tip_1: t.tip_1,
      tip_2: t.tip_2,
      points: played ? t.points_earned : null,
    };
  }

  const championLockAt = configRes.data?.champion_lock_at ?? new Date(0).toISOString();
  const championLocked = new Date(championLockAt).getTime() <= now.getTime();

  return (
    <TippsClient
      initial={{
        matches: matchInfos,
        tips: tipsObj,
        championTip: champRes.data?.champion_team ?? null,
        championLocked,
        championLockAt,
      }}
    />
  );
}
