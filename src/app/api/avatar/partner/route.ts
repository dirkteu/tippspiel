import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import { streamAvatar, PLACEHOLDER_SVG } from "../me/route";

/**
 * Liefert das Avatar des TIPPSPIEL-Team-Partners (gleiches team_id, anderes
 * Geschlecht) — das ist das Foto, das hinter den Kacheln auf /partner liegt.
 *
 * Wichtig: NICHT verwechseln mit profiles.real_partner_id — das ist der
 * echte Lebenspartner (vom Admin gepflegt zur Kandidaten-Exclusion). Wer
 * im Tippspiel zugeordnet ist, ergibt sich aus teams.id.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.profile.id) {
      return new NextResponse(PLACEHOLDER_SVG, {
        headers: { "Content-Type": "image/svg+xml" },
      });
    }

    const sb = supabaseService();
    const partnerGender = session.profile.gender === "m" ? "f" : "m";

    const { data: partner } = await sb
      .from("profiles")
      .select("avatar_url")
      .eq("team_id", session.team.id)
      .eq("gender", partnerGender)
      .maybeSingle();

    if (!partner?.avatar_url) {
      return new NextResponse(PLACEHOLDER_SVG, {
        headers: { "Content-Type": "image/svg+xml" },
      });
    }

    return streamAvatar(partner.avatar_url);
  } catch {
    return new NextResponse(PLACEHOLDER_SVG, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }
}
