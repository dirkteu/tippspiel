import { notFound, redirect } from "next/navigation";
import { supabaseService } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { JoinForm } from "./JoinForm";
import { AutoRelogin } from "./AutoRelogin";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { code } = await params;

  const session = await getSession();
  if (session) redirect("/spieltag");

  const sb = supabaseService();
  const { data: profile } = await sb
    .from("profiles")
    .select("id,team_id,gender,joined_at,username")
    .eq("invite_code", code)
    .maybeSingle();

  if (!profile) notFound();

  // Bereits beigetreten? → Auto-Relogin in einem anderen Browser.
  // Keine erneute Pseudonym-Abfrage, einfach Cookie setzen und weiter.
  if (profile.joined_at) {
    return (
      <div className="shell">
        <div className="screen">
          <AutoRelogin code={code} username={profile.username} />
        </div>
      </div>
    );
  }

  let teamName: string | null = null;
  let alreadyTeamNamed = false;
  let isTeamNameOwner = false;
  if (profile.team_id) {
    const { data: team } = await sb
      .from("teams")
      .select("team_name,team_name_owner_id")
      .eq("id", profile.team_id)
      .maybeSingle();
    teamName = team?.team_name ?? null;
    alreadyTeamNamed = !!team?.team_name;
    isTeamNameOwner = team?.team_name_owner_id === profile.id;
  }

  return (
    <div className="shell">
      <div className="screen">
        <JoinForm
          code={code}
          gender={profile.gender as "m" | "f"}
          teamName={teamName}
          alreadyTeamNamed={alreadyTeamNamed}
          isTeamNameOwner={isTeamNameOwner}
        />
      </div>
    </div>
  );
}
