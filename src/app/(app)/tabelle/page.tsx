import { AppBar } from "@/components/primitives/AppBar";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";

interface TeamRanking {
  id: string;
  team_name: string;
  total_points: number;
  volltreffer: number;
  is_me: boolean;
}

export default async function TabellePage() {
  const session = (await getSession())!;
  const sb = supabaseService();

  // Alle Teams laden
  const { data: teams } = await sb
    .from("teams")
    .select("id,team_name");
  // Alle Profile + Tipps + Champion-Tipps für die Aggregation
  const [{ data: profiles }, { data: tips }, { data: champTips }] = await Promise.all([
    sb.from("profiles").select("id,team_id"),
    sb.from("tips").select("profile_id,points_earned"),
    sb.from("champion_tips").select("profile_id,points_earned"),
  ]);

  const profileToTeam = new Map<string, string>();
  for (const p of profiles ?? []) profileToTeam.set(p.id, p.team_id);

  const pointsByTeam = new Map<string, { total: number; vt: number }>();
  for (const t of tips ?? []) {
    const teamId = profileToTeam.get(t.profile_id);
    if (!teamId) continue;
    const cur = pointsByTeam.get(teamId) ?? { total: 0, vt: 0 };
    cur.total += t.points_earned;
    if (t.points_earned >= 3) cur.vt += 1;
    pointsByTeam.set(teamId, cur);
  }
  for (const c of champTips ?? []) {
    const teamId = profileToTeam.get(c.profile_id);
    if (!teamId) continue;
    const cur = pointsByTeam.get(teamId) ?? { total: 0, vt: 0 };
    cur.total += c.points_earned;
    pointsByTeam.set(teamId, cur);
  }

  const ranking: TeamRanking[] = (teams ?? [])
    .map((t) => {
      const stats = pointsByTeam.get(t.id) ?? { total: 0, vt: 0 };
      return {
        id: t.id,
        team_name: t.team_name ?? "(unbenannt)",
        total_points: stats.total,
        volltreffer: stats.vt,
        is_me: t.id === session.team.id,
      };
    })
    .sort((a, b) => b.total_points - a.total_points);

  const RANK_CLS = ["gold", "silver", "bronze"];

  return (
    <div className="scroll">
      <AppBar />
      <span className="kicker">Deine Tabellen</span>
      <h1 className="h1" style={{ marginTop: 4 }}>Team-Ranking</h1>
      <div className="lb" style={{ marginTop: 16 }}>
        {ranking.length === 0 && (
          <p className="t-small">Noch keine Teams angelegt.</p>
        )}
        {ranking.map((r, i) => (
          <div key={r.id} className={`lb-row${r.is_me ? " me" : ""}`}>
            <span className={`lb-rank ${RANK_CLS[i] ?? ""}`}>{i + 1}</span>
            <span className="lb-av">🏁</span>
            <div>
              <div className="lb-name">{r.team_name}</div>
              <div className="lb-sub">{r.volltreffer} Volltreffer</div>
            </div>
            <span className="lb-pts">
              {r.total_points}
              <small> Pkt</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
