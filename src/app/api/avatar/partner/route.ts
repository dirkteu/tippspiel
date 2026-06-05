import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import { streamAvatar, PLACEHOLDER_SVG } from "../me/route";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.profile.id) return new NextResponse(PLACEHOLDER_SVG, { headers: { "Content-Type": "image/svg+xml" } });

    const sb = supabaseService();
    // Partner-ID finden
    const { data: profile } = await sb.from("profiles").select("real_partner_id").eq("id", session.profile.id).single();
    if (!profile?.real_partner_id) return new NextResponse(PLACEHOLDER_SVG, { headers: { "Content-Type": "image/svg+xml" } });

    // Avatar des Partners finden
    const { data: partner } = await sb.from("profiles").select("avatar_url").eq("id", profile.real_partner_id).single();
    if (!partner?.avatar_url) return new NextResponse(PLACEHOLDER_SVG, { headers: { "Content-Type": "image/svg+xml" } });

    return streamAvatar(partner.avatar_url);
  } catch (e) {
    return new NextResponse(PLACEHOLDER_SVG, { headers: { "Content-Type": "image/svg+xml" } });
  }
}
