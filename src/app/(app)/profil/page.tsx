import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AppBar } from "@/components/primitives/AppBar";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import { fetchAllMatches, fetchAllTips, fetchTeamMemberIds, fetchTipsForTeam } from "@/lib/matches";
import { tilesUnlocked } from "@/lib/tiles";
import { LogoutItem } from "./LogoutItem";

export default async function ProfilPage() {
  const session = (await getSession())!;
  const sb = supabaseService();

  const memberIds = await fetchTeamMemberIds(session.team.id);
  const [tipsResp, champResp, matches, teamTips] = await Promise.all([
    sb.from("tips").select("points_earned").eq("profile_id", session.profile.id),
    sb
      .from("champion_tips")
      .select("points_earned")
      .eq("profile_id", session.profile.id)
      .maybeSingle(),
    fetchAllMatches(),
    fetchTipsForTeam(memberIds),
  ]);

  const myPoints = (tipsResp.data ?? []).reduce((s, t) => s + t.points_earned, 0)
    + (champResp.data?.points_earned ?? 0);
  const volltreffer = (tipsResp.data ?? []).filter((t) => t.points_earned === 4).length;

  const tilesOpen = tilesUnlocked(
    session.profile.id,
    matches.map((m) => ({
      id: m.id,
      round: m.round,
      match_date: m.match_date,
      result_1: m.result_1,
      result_2: m.result_2,
    })),
    teamTips.map((t) => ({
      match_id: t.match_id,
      profile_id: t.profile_id,
      points_earned: t.points_earned,
    })),
  );

  // Rang berechnen (über Team)
  const { data: allProfiles } = await sb.from("profiles").select("id,team_id");
  const allTips = await fetchAllTips();
  const { data: allChamp } = await sb.from("champion_tips").select("profile_id,points_earned");
  const profToTeam = new Map<string, string>();
  for (const p of allProfiles ?? []) profToTeam.set(p.id, p.team_id);
  const byTeam = new Map<string, number>();
  for (const t of allTips ?? []) {
    const tid = profToTeam.get(t.profile_id);
    if (tid) byTeam.set(tid, (byTeam.get(tid) ?? 0) + t.points_earned);
  }
  for (const c of allChamp ?? []) {
    const tid = profToTeam.get(c.profile_id);
    if (tid) byTeam.set(tid, (byTeam.get(tid) ?? 0) + c.points_earned);
  }
  const sorted = [...byTeam.entries()].sort((a, b) => b[1] - a[1]);
  const rank = sorted.findIndex(([id]) => id === session.team.id) + 1;

  return (
    <div className="scroll">
      <AppBar />
      <div className="profile-head">
        <div className="profile-av">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/avatar/me"
            alt=""
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
          />
        </div>
        <span className="kicker">Dein Pseudonym</span>
        <div className="partner-name" style={{ fontSize: 22, marginTop: -4 }}>
          {session.profile.username ?? "(noch keins)"}
        </div>
        {/* Team-Name ist Spoiler: Frau hat ihn vergeben + Mann darf nicht
            schließen, wer es ist. Erst nach 9/9 Kacheln verraten. */}
        {tilesOpen >= 9 ? (
          <span className="t-small">
            Team: {session.team.team_name ?? "(unbenannt)"} ·{" "}
            {session.profile.gender === "f" ? "Frau" : "Mann"}
          </span>
        ) : (
          <span className="t-small">
            {session.profile.gender === "f" ? "Frau" : "Mann"} im Squad
          </span>
        )}
      </div>

      <div className="stats" style={{ marginTop: 8 }}>
        <div className="stat">
          <div className="v">{myPoints}</div>
          <div className="l">Punkte gesamt</div>
        </div>
        <div className="stat">
          <div className="v green">{volltreffer}</div>
          <div className="l">Volltreffer</div>
        </div>
        <div className="stat">
          <div className="v" title={tilesOpen < 9 ? "Wird sichtbar, wenn alle Kacheln aufgedeckt sind" : undefined}>
            {tilesOpen >= 9 ? (rank ? `#${rank}` : "—") : "🔒"}
          </div>
          <div className="l">Team-Rang</div>
        </div>
        <div className="stat">
          <div className="v">{tilesOpen}/9</div>
          <div className="l">Nachbar-Kacheln</div>
        </div>
      </div>

      <div className="section-head"><span className="kicker">Konto</span></div>
      <div className="card" style={{ overflow: "hidden" }}>
        <Link
          href="/regeln"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            color: "var(--fg2)",
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Tipp-Regeln
          <span style={{ marginLeft: "auto", color: "var(--fg4)", display: "flex" }}>
            <ChevronRight size={18} />
          </span>
        </Link>
        <LogoutItem />
      </div>
    </div>
  );
}
