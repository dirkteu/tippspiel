import { AppBar } from "@/components/primitives/AppBar";
import { PartnerTile } from "@/components/PartnerTile";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import { fetchAllMatches, fetchTeamMemberIds, fetchTipsForTeam } from "@/lib/matches";
import { tilesUnlocked } from "@/lib/tiles";
import { PartnerGuessList } from "./PartnerGuessList";

export default async function PartnerPage() {
  const session = (await getSession())!;
  const memberIds = await fetchTeamMemberIds(session.team.id);
  const partnerGender = session.profile.gender === "m" ? "f" : "m";

  const sb = supabaseService();
  const [partnerRes, meRes] = await Promise.all([
    sb
      .from("profiles")
      .select("id,username")
      .eq("team_id", session.team.id)
      .eq("gender", partnerGender)
      .maybeSingle(),
    sb
      .from("profiles")
      .select("partner_revealed_at")
      .eq("id", session.profile.id)
      .maybeSingle(),
  ]);
  const partner = partnerRes.data;
  const alreadyRevealed = !!meRes.data?.partner_revealed_at;

  const [matches, tips, candidatesRes] = await Promise.all([
    fetchAllMatches(),
    fetchTipsForTeam(memberIds),
    // Alle Roster-Spieler des Partner-Geschlechts (mit echtem Namen).
    // Ohne echte Identität von "mir selbst" als Distraktor — der Spieler
    // ist sowieso nicht Kandidat.
    sb
      .from("profiles")
      .select("id,real_name")
      .eq("gender", partnerGender)
      .order("real_name", { ascending: true }),
  ]);
  const candidates = (candidatesRes.data ?? [])
    .filter((c) => c.real_name)
    .map((c) => ({ id: c.id, real_name: c.real_name! }));

  const open = tilesUnlocked(
    { member_profile_ids: memberIds },
    matches.map((m) => ({
      id: m.id,
      round: m.round,
      match_date: m.match_date,
      result_1: m.result_1,
      result_2: m.result_2,
    })),
    tips.map((t) => ({
      match_id: t.match_id,
      profile_id: t.profile_id,
      points_earned: t.points_earned,
    })),
  );

  // Sobald aufgelöst (= entweder alle Kacheln offen oder erfolgreiches
  // Raten in der Vergangenheit) → Pseudonym freigeben.
  const revealedName =
    partner && (open >= 9 || alreadyRevealed) ? partner.username : null;

  return (
    <div className="scroll">
      <AppBar />
      <span className="kicker">
        {partnerGender === "f" ? "Deine geheime Nachbarin" : "Dein geheimer Nachbar"}
      </span>
      <h1 className="h1" style={{ marginTop: 4 }}>Wer ist es?</h1>
      <p className="t-small" style={{ marginTop: 6, marginBottom: 18 }}>
        Jedes gewertete Vorrundenspiel deckt eine Kachel auf. Volltreffer
        (≥3 Punkte) deines Teams bringen je eine weitere. Errätst du es
        richtig, fallen alle.
      </p>

      {partner ? (
        <PartnerTile
          photoSrc="/api/avatar/partner"
          tileOrder={session.team.tile_order}
          tilesOpen={open}
          revealedName={revealedName}
        />
      ) : (
        <div className="card pad">
          <span className="kicker">
            {partnerGender === "f" ? "Nachbarin noch nicht da" : "Nachbar noch nicht da"}
          </span>
          <p className="t-small" style={{ marginTop: 6 }}>
            {partnerGender === "f"
              ? "Deine Nachbarin hat den Squad noch nicht betreten. Erinnere sie doch an ihren Einladungs-Link."
              : "Dein Nachbar hat den Squad noch nicht betreten. Erinnere ihn doch an seinen Einladungs-Link."}
          </p>
        </div>
      )}

      {candidates.length > 0 && (
        <PartnerGuessList
          candidates={candidates}
          alreadyRevealed={alreadyRevealed ? (partner?.username ?? null) : null}
          partnerGender={partnerGender}
        />
      )}
    </div>
  );
}
