import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";

const Body = z.object({
  tips: z
    .array(
      z.object({
        match_id: z.string().uuid(),
        tip_1: z.number().int().min(0).max(30),
        tip_2: z.number().int().min(0).max(30),
      }),
    )
    .max(120),
  champion: z.string().min(2).max(40).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const sb = supabaseService();
  const results: { match_id: string; ok: boolean; error?: string }[] = [];

  // Pro Tipp einzelne Upserts — der Sperrfrist-Trigger sperrt einzelne Spiele.
  // Ein gesperrtes Spiel rollt nicht alle anderen mit zurück.
  for (const t of parsed.data.tips) {
    const { error } = await sb
      .from("tips")
      .upsert(
        {
          profile_id: session.profile.id,
          match_id: t.match_id,
          tip_1: t.tip_1,
          tip_2: t.tip_2,
        },
        { onConflict: "profile_id,match_id" },
      );
    if (error) {
      results.push({ match_id: t.match_id, ok: false, error: friendly(error.message) });
    } else {
      results.push({ match_id: t.match_id, ok: true });
    }
  }

  let championResult: { ok: boolean; error?: string } | undefined;
  if (parsed.data.champion) {
    const { error } = await sb.from("champion_tips").upsert(
      {
        profile_id: session.profile.id,
        champion_team: parsed.data.champion,
      },
      { onConflict: "profile_id" },
    );
    championResult = error
      ? { ok: false, error: friendly(error.message) }
      : { ok: true };
  }

  return NextResponse.json({ results, champion: championResult });
}

function friendly(msg: string): string {
  if (msg.includes("Weltmeister-Tipp ist final"))
    return "Weltmeister-Tipp ist final — nicht mehr änderbar";
  if (msg.includes("Weltmeister-Tipp gesperrt")) return "Weltmeister-Sperrfrist überschritten";
  if (msg.includes("Tipp gesperrt")) return "Sperrfrist überschritten";
  return msg;
}
