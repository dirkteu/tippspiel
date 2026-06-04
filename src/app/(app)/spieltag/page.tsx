import Link from "next/link";
import { Bell } from "lucide-react";
import { AppBar } from "@/components/primitives/AppBar";
import { Button } from "@/components/primitives/Button";
import { MatchCard } from "@/components/MatchCard";
import { getSession } from "@/lib/auth";
import {
  fetchAllMatches,
  fetchTipsForProfile,
  isLocked,
  roundLabel,
} from "@/lib/matches";

export default async function SpieltagPage() {
  const session = (await getSession())!;
  const [matches, tips] = await Promise.all([
    fetchAllMatches(),
    fetchTipsForProfile(session.profile.id),
  ]);
  const tipByMatch = new Map(tips.map((t) => [t.match_id, t]));
  const now = new Date();
  const upcoming = matches
    .filter((m) => !isLocked(m, now))
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  const next = upcoming[0] ?? null;
  const restPreview = upcoming.slice(1, 3);

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
            tip={
              tipByMatch.has(next.id)
                ? {
                    tip_1: tipByMatch.get(next.id)!.tip_1,
                    tip_2: tipByMatch.get(next.id)!.tip_2,
                    saved: true,
                    points: tipByMatch.get(next.id)!.points_earned,
                  }
                : null
            }
          />
          <Link href="/tipps" style={{ textDecoration: "none" }}>
            <Button variant="primary">Alle Tipps abgeben</Button>
          </Link>
        </>
      )}

      {restPreview.length > 0 && (
        <>
          <div className="section-head">
            <span className="kicker">Weitere offene Spiele</span>
            <span className="lb-sub">{upcoming.length - 1} offen</span>
          </div>
          {restPreview.map((m) => (
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
              tip={
                tipByMatch.has(m.id)
                  ? {
                      tip_1: tipByMatch.get(m.id)!.tip_1,
                      tip_2: tipByMatch.get(m.id)!.tip_2,
                      saved: true,
                      points: tipByMatch.get(m.id)!.points_earned,
                    }
                  : null
              }
            />
          ))}
        </>
      )}
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
