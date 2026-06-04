import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import { streamAvatar } from "../me/route";

export async function GET() {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 401 });

  const sb = supabaseService();
  const partnerGender = session.profile.gender === "m" ? "f" : "m";

  const { data: partner } = await sb
    .from("profiles")
    .select("avatar_url")
    .eq("team_id", session.team.id)
    .eq("gender", partnerGender)
    .maybeSingle();

  if (!partner?.avatar_url) {
    return new NextResponse(null, { status: 404 });
  }
  return streamAvatar(partner.avatar_url);
}
