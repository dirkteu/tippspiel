import { notFound, redirect } from "next/navigation";
import { supabaseService } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { JoinForm } from "./JoinForm";

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

  let teamName: string | null = null;
  let alreadyTeamNamed = false;
  if (profile.team_id) {
    const { data: team } = await sb
      .from("teams")
      .select("team_name")
      .eq("id", profile.team_id)
      .maybeSingle();
    teamName = team?.team_name ?? null;
    alreadyTeamNamed = !!team?.team_name;
  }

  return (
    <div className="shell">
      <div className="screen">
        <JoinForm
          code={code}
          gender={profile.gender as "m" | "f"}
          teamName={teamName}
          alreadyTeamNamed={alreadyTeamNamed}
        />
      </div>
    </div>
  );
}
