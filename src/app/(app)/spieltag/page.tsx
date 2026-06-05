import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { AppBar } from "@/components/primitives/AppBar";
import { Button } from "@/components/primitives/Button";
import { MatchCard, type TipState } from "@/components/MatchCard";
import { GroupStandingsTable } from "@/components/GroupStandingsTable";
import { getSession } from "@/lib/auth";
import {
  fetchAllMatches,
  fetchTipsForProfile,
  isLocked,
  roundLabel,
  type MatchRow,
} from "@/lib/matches";
import { computeGroupStandings } from "@/lib/standings";

type StoredTip = { tip_1: number; tip_2: number; points_earned: number };

/**
 * Baut den TipState für die MatchCard. Wichtig: Punkte werden nur dann
 * gezeigt, wenn das Spiel auch wirklich ein Ergebnis hat — sonst steht
 * der DB-Default 0 fälschlich als "Gewertet · 0 Pkt" da.
 */
function tipFor(m: MatchRow, stored: StoredTip | undefined): TipState | null {
  if (!stored) return null;
  const played = m.result_1 != null && m.result_2 != null;
  return {
    tip_1: stored.tip_1,
    tip_2: stored.tip_2,
    saved: true,
    points: played ? stored.points_earned : null,
  };
}

export default async function SpieltagPage() {
  const session = (await getSession())!;
  const [matches, tips] = await Promise.all([
    fetchAllMatches(),
    fetchTipsForProfile(session.profile.id),
  ]);
  const tipByMatch = new Map<string, StoredTip>(tips.map((t) => [t.match_id, t]));
  const now = new Date();
  const upcoming = matches
    .filter((m) => !isLocked(m, now))
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  const next = upcoming[0] ?? null;

  // Ungetippte offene Spiele — alles, was noch ein Tipp braucht.
  const untipped = upcoming.filter((m) => !tipByMatch.has(m.id));
  const untippedRest = next ? untipped.filter((m) => m.id !== next.id) : untipped;
  const untippedRestPreview = untippedRest.slice(0, 3);

  const standings = computeGroupStandings(matches);

  return (
    <div className="scroll">
      <AppBar
        action={
          <button className="icon-btn" aria-label="Benachrichtigungen">
            <Bell size={19} />
          </button>
        }
      />
      <span className="kicker">Secret Squad</span>
      <h1 className="h1" style={{ marginTop: 4 }}>
        {next ? formatCountdownHeadline(next.match_date) : "Turnier läuft"}
      </h1>

      {next && (
        <>
          <div className="section-head">
            <span className="kicker">Nächstes Spiel</span>
          </div>
          <MatchCard
            match={{
              id: next.id,
              round_label: roundLabel(next),
              kickoff: next.match_date,
              team_1: next.team_1,
              team_2: next.team_2,
              flag_1: next.flag_1,
              flag_2: next.flag_2,
              stadium: next.stadium,
              locked: false,
            }}
            tip={tipFor(next, tipByMatch.get(next.id))}
          />
          {untipped.length > 0 ? (
            <Link href="/tipps" style={{ textDecoration: "none" }}>
              <Button variant="primary">
                {untipped.length === 1
                  ? "1 Tipp abgeben"
                  : `${untipped.length} Tipps abgeben`}
              </Button>
            </Link>
          ) : (
            <div
              className="tip-flag"
              style={{
                justifyContent: "center",
                margin: "16px 0 4px",
                fontSize: 13,
              }}
            >
              <Check size={15} /> Alle Tipps abgegeben
            </div>
          )}
        </>
      )}

      {untippedRestPreview.length > 0 && (
        <>
          <div className="section-head">
            <span className="kicker">Noch ungetippt</span>
            <span className="lb-sub">{untippedRest.length} offen</span>
          </div>
          {untippedRestPreview.map((m) => (
            <MatchCard
              key={m.id}
              match={{
                id: m.id,
                round_label: roundLabel(m),
                kickoff: m.match_date,
                team_1: m.team_1,
                team_2: m.team_2,
                flag_1: m.flag_1,
                flag_2: m.flag_2,
                stadium: m.stadium,
                locked: false,
              }}
              tip={tipFor(m, tipByMatch.get(m.id))}
            />
          ))}
        </>
      )}

      {standings.map((g) => (
        <section key={g.group_name}>
          <div className="section-head">
            <span className="kicker">Tabelle · {g.group_name}</span>
          </div>
          <GroupStandingsTable group={g} />
        </section>
      ))}
    </div>
  );
}

function formatCountdownHeadline(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Anpfiff jetzt";
  const days = Math.floor(diff / (24 * 60 * 60_000));
  if (days >= 2) return `Anpfiff in ${days} Tagen`;
  if (days === 1) return "Anpfiff morgen";
  const h = Math.floor(diff / 3_600_000);
  if (h >= 1) return `Anpfiff in ${h} Stunden`;
  return "Anpfiff bald";
}
