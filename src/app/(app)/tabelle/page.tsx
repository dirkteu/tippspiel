import { AppBar } from "@/components/primitives/AppBar";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import { fetchAllMatches, fetchAllTips, fetchTeamMemberIds, fetchTipsForTeam, teamsRevealed } from "@/lib/matches";
import { tilesUnlocked } from "@/lib/tiles";

interface TeamRanking {
  id: string;
  team_name: string;
  total_points: number;
  volltreffer: number;
  /** Positionswechsel seit dem letzten beendeten Spiel. >0 = aufgestiegen, <0 = abgestiegen, 0 = gleich, null = noch keine Vergleichsdaten */
  tendency: number | null;
  is_me: boolean;
  /** Nach der Team-Auflösung: die beiden Mitglieder (Foto + Pseudonym). */
  members: { id: string; username: string }[];
}

interface IndividualRanking {
  id: string;
  username: string;
  gender: "m" | "f";
  total_points: number;
  is_me: boolean;
  /** Klarname — wird erst nach der Team-Auflösung angezeigt. */
  real_name: string | null;
}

const RANK_CLS = ["gold", "silver", "bronze"];

function rankIcon(place: number, isLast: boolean): string {
  if (place === 1) return "⭐⭐⭐";
  if (isLast) return "💋";
  return "";
}

/** Tendenz-Pille: ▲ aufgestiegen / ▼ abgestiegen / ▬ keine Bewegung. */
function Tendency({ value }: { value: number }) {
  const color =
    value > 0 ? "var(--win, #16a34a)" : value < 0 ? "var(--loss, #dc2626)" : "var(--fg4)";
  const icon = value > 0 ? "▲" : value < 0 ? "▼" : "▬";
  const label = value === 0 ? "" : Math.abs(value).toString();
  return (
    <span
      title="Veränderung seit letztem beendeten Spiel"
      style={{ marginLeft: 8, color, fontWeight: 600, fontSize: 12 }}
    >
      {icon}
      {label && <span style={{ marginLeft: 2 }}>{label}</span>}
    </span>
  );
}

export default async function TabellePage() {
  const session = (await getSession())!;
  const sb = supabaseService();

  // Teams + Profile + alle Tipps  + tilesUnlocked-Daten fuer Anti-Leak-Gate
  const memberIds = await fetchTeamMemberIds(session.team.id);
  const [
    { data: teams },
    { data: profiles },
    tips,
    { data: champTips },
    allMatches,
    teamTips,
  ] = await Promise.all([
    sb.from("teams").select("id,team_name"),
    sb.from("profiles").select("id,team_id,username,gender,joined_at,real_name"),
    fetchAllTips(),
    sb.from("champion_tips").select("profile_id,points_earned"),
    fetchAllMatches(),
    fetchTipsForTeam(memberIds),
  ]);

  // Wie viele Nachbar-Kacheln hat der aktuelle Spieler aufgedeckt?
  // Bis 9/9 darf nicht erkennbar sein, welches Team einem gehoert.
  const tilesOpen = tilesUnlocked(
    session.profile.id,
    allMatches.map((m) => ({
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
  const revealAllowed = tilesOpen >= 9;

  const profileToTeam = new Map<string, string | null>();
  for (const p of profiles ?? []) profileToTeam.set(p.id, p.team_id);

  // Team-Aggregation
  const pointsByTeam = new Map<string, { total: number; vt: number }>();
  for (const t of tips ?? []) {
    const teamId = profileToTeam.get(t.profile_id);
    if (!teamId) continue;
    const cur = pointsByTeam.get(teamId) ?? { total: 0, vt: 0 };
    cur.total += t.points_earned;
    if (t.points_earned === 4) cur.vt += 1;
    pointsByTeam.set(teamId, cur);
  }
  for (const c of champTips ?? []) {
    const teamId = profileToTeam.get(c.profile_id);
    if (!teamId) continue;
    const cur = pointsByTeam.get(teamId) ?? { total: 0, vt: 0 };
    cur.total += c.points_earned;
    pointsByTeam.set(teamId, cur);
  }

  // Tendenz: Vergleich Ranking vor vs. nach dem letzten beendeten Spiel.
  // Letztes beendetes Spiel = juengstes Match mit Ergebnis.
  const completedMatches = allMatches.filter(
    (m) => m.result_1 != null && m.result_2 != null,
  );
  const lastMatch = completedMatches.length > 0
    ? completedMatches.reduce((a, b) =>
        new Date(a.match_date).getTime() > new Date(b.match_date).getTime() ? a : b,
      )
    : null;

  // Beitrag des letzten Spiels pro Team — den ziehen wir vom Aktuellen ab.
  const lastMatchContribByTeam = new Map<string, number>();
  if (lastMatch) {
    for (const t of tips ?? []) {
      if (t.match_id !== lastMatch.id) continue;
      const teamId = profileToTeam.get(t.profile_id);
      if (!teamId) continue;
      lastMatchContribByTeam.set(
        teamId,
        (lastMatchContribByTeam.get(teamId) ?? 0) + t.points_earned,
      );
    }
  }

  // Hilfsfunktion: stabile Platzierung (gleiche Punkte → alphabetisch nach team.id)
  function buildRankMap(pointsByTeamLocal: Map<string, number>): Map<string, number> {
    const teamIds = (teams ?? []).map((t) => t.id);
    const sorted = [...teamIds].sort((a, b) => {
      const pa = pointsByTeamLocal.get(a) ?? 0;
      const pb = pointsByTeamLocal.get(b) ?? 0;
      if (pb !== pa) return pb - pa;
      return a.localeCompare(b);
    });
    const ranks = new Map<string, number>();
    sorted.forEach((id, i) => ranks.set(id, i + 1));
    return ranks;
  }

  const currentPointsMap = new Map<string, number>();
  for (const t of teams ?? []) {
    currentPointsMap.set(t.id, pointsByTeam.get(t.id)?.total ?? 0);
  }
  const previousPointsMap = new Map<string, number>();
  for (const t of teams ?? []) {
    previousPointsMap.set(
      t.id,
      (pointsByTeam.get(t.id)?.total ?? 0) - (lastMatchContribByTeam.get(t.id) ?? 0),
    );
  }
  const currentRankMap = buildRankMap(currentPointsMap);
  const previousRankMap = lastMatch ? buildRankMap(previousPointsMap) : null;

  // Team-Auflösung: nach dem letzten gewerteten Halbfinale fällt das
  // Geheimnis — die Tabelle zeigt dann Fotos + Pseudonyme der Mitglieder.
  const revealed = teamsRevealed(allMatches);
  const membersByTeam = new Map<string, { id: string; username: string }[]>();
  if (revealed) {
    for (const p of profiles ?? []) {
      if (!p.team_id || !p.username) continue;
      if (!membersByTeam.has(p.team_id)) membersByTeam.set(p.team_id, []);
      membersByTeam.get(p.team_id)!.push({ id: p.id, username: p.username });
    }
  }

  const teamRanking: TeamRanking[] = (teams ?? [])
    .map((t) => {
      const stats = pointsByTeam.get(t.id) ?? { total: 0, vt: 0 };
      const tendency = previousRankMap
        ? (previousRankMap.get(t.id) ?? 0) - (currentRankMap.get(t.id) ?? 0)
        : null;
      return {
        id: t.id,
        team_name: t.team_name ?? "(unbenannt)",
        total_points: stats.total,
        volltreffer: stats.vt,
        tendency,
        // Eigene Team-Zeile erst markieren, wenn alle 9 Kacheln offen sind —
        // oder wenn die Teams ohnehin aufgelöst sind.
        is_me: (revealAllowed || revealed) && t.id === session.team.id,
        members: membersByTeam.get(t.id) ?? [],
      };
    })
    .sort((a, b) => b.total_points - a.total_points);

  // Einzel-Aggregation (nur Spieler die schon beigetreten sind = haben Pseudonym)
  const pointsByPlayer = new Map<string, number>();
  for (const t of tips ?? []) {
    pointsByPlayer.set(t.profile_id, (pointsByPlayer.get(t.profile_id) ?? 0) + t.points_earned);
  }
  for (const c of champTips ?? []) {
    pointsByPlayer.set(c.profile_id, (pointsByPlayer.get(c.profile_id) ?? 0) + c.points_earned);
  }

  const individualRanking: IndividualRanking[] = (profiles ?? [])
    .filter((p) => p.joined_at && p.username)
    .map((p) => ({
      id: p.id,
      username: p.username!,
      gender: p.gender as "m" | "f",
      total_points: pointsByPlayer.get(p.id) ?? 0,
      is_me: p.id === session.profile.id,
      real_name: p.real_name ?? null,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  return (
    <div className="scroll">
      <AppBar />
      <span className="kicker">Deine Tabellen</span>
      <h1 className="h1" style={{ marginTop: 4 }}>Team-Ranking</h1>

      {/* Team-Ranking */}
      <div className="lb" style={{ marginTop: 16 }}>
        {teamRanking.length === 0 && (
          <p className="t-small">Noch keine Teams angelegt.</p>
        )}
        {teamRanking.map((r, i) => (
          <div key={r.id} className={`lb-row${r.is_me ? " me" : ""}`}>
            <span className={`lb-rank ${RANK_CLS[i] ?? ""}`}>{i + 1}</span>
            {r.members.length > 0 ? (
              /* Aufgelöst: die beiden Selfies überlappend statt 🏁 */
              <span style={{ display: "inline-flex", flexShrink: 0 }}>
                {r.members.map((m, mi) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={m.id}
                    src={`/api/avatar/team-member/${m.id}`}
                    alt={m.username}
                    width={34}
                    height={34}
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid var(--bg)",
                      marginLeft: mi > 0 ? -10 : 0,
                      position: "relative",
                      zIndex: r.members.length - mi,
                    }}
                  />
                ))}
              </span>
            ) : (
              <span className="lb-av">🏁</span>
            )}
            <div>
              <div className="lb-name">{r.team_name}</div>
              <div className="lb-sub">
                {r.members.length > 0 && (
                  <>{r.members.map((m) => m.username).join(" + ")} · </>
                )}
                {r.volltreffer} Volltreffer
                {r.tendency !== null && (
                  <Tendency value={r.tendency} />
                )}
              </div>
            </div>
            <span className="lb-pts">
              {r.total_points}
              <small> Pkt</small>
            </span>
          </div>
        ))}
      </div>

      {/* Einzel-Ranking */}
      <IndividualBlock
        title="Einzel · Gesamt"
        rows={individualRanking}
        currentId={session.profile.id}
        revealed={revealed}
      />
    </div>
  );
}

/**
 * Vor der Team-Auflösung: nur der Erste, die eigene Position (falls weder
 * Erster noch Letzter) und der Letzte, mit "…"-Trennern — anonym genug,
 * um das Team-Rätsel nicht zu verraten.
 * Nach der Auflösung: die KOMPLETTE Liste, mit Foto + Klarnamen.
 */
function IndividualBlock({
  title,
  rows,
  currentId,
  revealed,
}: {
  title: string;
  rows: IndividualRanking[];
  currentId: string;
  revealed: boolean;
}) {
  if (rows.length === 0) {
    return null;
  }

  if (revealed) {
    return (
      <section>
        <div className="section-head">
          <span className="kicker">{title}</span>
        </div>
        <div className="lb">
          {rows.map((r, i) => (
            <RankRow
              key={r.id}
              place={i + 1}
              row={r}
              icon={rankIcon(i + 1, i === rows.length - 1 && rows.length > 1)}
              revealed
            />
          ))}
        </div>
      </section>
    );
  }

  const lastIdx = rows.length - 1;
  const myIdx = rows.findIndex((r) => r.id === currentId);
  const showMe = myIdx > 0 && myIdx < lastIdx;

  return (
    <section>
      <div className="section-head">
        <span className="kicker">{title}</span>
      </div>
      <div className="lb">
        <RankRow place={1} row={rows[0]} icon={rankIcon(1, false)} />
        {showMe && myIdx > 1 && <Ellipsis />}
        {showMe && (
          <RankRow place={myIdx + 1} row={rows[myIdx]} icon="" />
        )}
        {rows.length > 1 && (
          <>
            {((showMe && myIdx < lastIdx - 1) || (!showMe && lastIdx > 1)) && <Ellipsis />}
            <RankRow
              place={lastIdx + 1}
              row={rows[lastIdx]}
              icon={rankIcon(lastIdx + 1, true)}
            />
          </>
        )}
      </div>
    </section>
  );
}

function Ellipsis() {
  return (
    <div style={{ textAlign: "center", color: "var(--fg4)", fontSize: 13, padding: "4px 0" }}>
      …
    </div>
  );
}

function RankRow({
  place,
  row,
  icon,
  revealed = false,
}: {
  place: number;
  row: IndividualRanking;
  icon: string;
  revealed?: boolean;
}) {
  return (
    <div className={`lb-row${row.is_me ? " me" : ""}`}>
      <span className={`lb-rank ${RANK_CLS[place - 1] ?? ""}`}>{place}</span>
      {revealed && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`/api/avatar/team-member/${row.id}`}
          alt={row.username}
          width={34}
          height={34}
          style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        />
      )}
      <div>
        <div className="lb-name">
          {row.username}
          {icon && <span style={{ marginLeft: 6, fontSize: 13 }}>{icon}</span>}
        </div>
        {revealed && row.real_name && (
          <div className="lb-sub">{row.real_name}</div>
        )}
        {!revealed && icon && <div className="lb-sub" style={{ fontSize: 14 }}>{icon}</div>}
      </div>
      <span className="lb-pts">
        {row.total_points}
        <small> Pkt</small>
      </span>
    </div>
  );
}
