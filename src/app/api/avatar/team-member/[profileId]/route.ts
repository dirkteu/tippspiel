import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import { PLACEHOLDER_SVG, streamAvatar } from "../../me/route";

interface Ctx {
  params: Promise<{ profileId: string }>;
}

/**
 * Avatar eines beliebigen Spielers — NUR nach der Team-Auflösung.
 *
 * Das Spielgeheimnis (wer bildet mit wem ein Team) fällt erst, wenn das
 * letzte Halbfinale gewertet ist. Vorher liefert dieser Endpoint 403,
 * damit niemand über die Bild-URLs vorab Gesichter zuordnen kann.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const sb = supabaseService();

  // Reveal-Gate: mind. ein sf-Spiel vorhanden UND keines ohne Ergebnis.
  const { count: sfTotal } = await sb
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("round", "sf");
  const { count: sfOpen } = await sb
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("round", "sf")
    .or("result_1.is.null,result_2.is.null");
  if (!sfTotal || (sfOpen ?? 0) > 0) {
    return NextResponse.json({ error: "Teams sind noch nicht aufgelöst" }, { status: 403 });
  }

  const { profileId } = await ctx.params;
  const { data: profile } = await sb
    .from("profiles")
    .select("avatar_url")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile?.avatar_url) {
    return new NextResponse(PLACEHOLDER_SVG, { headers: { "Content-Type": "image/svg+xml" } });
  }
  // Nach der Auflösung ändern sich die Bilder nicht mehr — großzügig cachen.
  return streamAvatar(profile.avatar_url, "private, max-age=3600");
}
