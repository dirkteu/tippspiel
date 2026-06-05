import Link from "next/link";
import { Info } from "lucide-react";
import { AppBar } from "@/components/primitives/AppBar";
import { PartnerTile } from "@/components/PartnerTile";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import { fetchAllMatches, fetchTeamMemberIds, fetchTipsForTeam } from "@/lib/matches";
import { tilesUnlocked } from "@/lib/tiles";

export default async function PartnerPage() {
  const session = (await getSession())!;
  const memberIds = await fetchTeamMemberIds(session.team.id);
  const partnerGender = session.profile.gender === "m" ? "f" : "m";

  const sb = supabaseService();
  const { data: partner } = await sb
    .from("profiles")
    .select("id,username")
    .eq("team_id", session.team.id)
    .eq("gender", partnerGender)
    .maybeSingle();

  const [matches, tips] = await Promise.all([
    fetchAllMatches(),
    fetchTipsForTeam(memberIds),
  ]);

  const open = tilesUnlocked(
    { member_profile_ids: memberIds },
    matches.map((m) => ({ id: m.id, round: m.round, match_date: m.match_date })),
    tips.map((t) => ({
      match_id: t.match_id,
      profile_id: t.profile_id,
      points_earned: t.points_earned,
    })),
  );

  return (
    <div className="scroll">
      <AppBar
        action={
          <Link href="/regeln" className="icon-btn" aria-label="Tipp-Regeln">
            <Info size={19} />
          </Link>
        }
      />
      <span className="kicker">Dein geheimer Partner</span>
      <h1 className="h1" style={{ marginTop: 4 }}>Wer ist es?</h1>
      <p className="t-small" style={{ marginTop: 6, marginBottom: 18 }}>
        Jeder Volltreffer (≥3 Punkte) deines Teams deckt eine Kachel auf.
        K.o.-Runden bringen Bonus-Kacheln. Im Finale fällt der Vorhang.
      </p>

      {partner ? (
        <PartnerTile
          photoSrc="/api/avatar/partner"
          tileOrder={session.team.tile_order}
          tilesOpen={open}
          revealedName={open >= 9 ? partner.username : null}
        />
      ) : (
        <div className="card pad">
          <span className="kicker">Partner noch nicht da</span>
          <p className="t-small" style={{ marginTop: 6 }}>
            Dein Partner hat den Squad noch nicht betreten. Erinnere ihn doch
            an seinen Einladungs-Link.
          </p>
        </div>
      )}
    </div>
  );
}
