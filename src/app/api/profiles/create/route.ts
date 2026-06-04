import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { generateLoginToken, LOGIN_TOKEN_COOKIE } from "@/lib/auth";

const Body = z.object({
  invite_code: z.string().min(4).max(64),
  username: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[\p{L}\p{N} _.-]+$/u, "Nur Buchstaben, Zahlen, Leer-/Sonderzeichen"),
  team_name: z.string().min(2).max(40).optional(),
  // Foto kommt jetzt vom Admin, nicht mehr vom Spieler
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 400 },
    );
  }
  const { invite_code, username, team_name } = parsed.data;
  const sb = supabaseService();

  // 1. Profil über Invite-Code finden (existiert bereits aus Roster!)
  const { data: profile } = await sb
    .from("profiles")
    .select("id,team_id,gender,joined_at,login_token,avatar_url")
    .eq("invite_code", invite_code)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Ungültiger Einladungs-Code" }, { status: 404 });
  }
  if (!profile.team_id) {
    return NextResponse.json(
      { error: "Spieler ist noch keinem Team zugeordnet — Admin muss erst Teams würfeln" },
      { status: 409 },
    );
  }

  // 2. Bereits beigetreten? → bestehenden Token zurückliefern
  if (profile.joined_at && profile.login_token) {
    const c = await cookies();
    c.set(LOGIN_TOKEN_COOKIE, profile.login_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return NextResponse.json({
      login_token: profile.login_token,
      profile_id: profile.id,
      team_id: profile.team_id,
      gender: profile.gender,
      reused: true,
    });
  }

  // 3. Pseudonym auf Eindeutigkeit prüfen
  const { data: dupe } = await sb
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", profile.id)
    .maybeSingle();
  if (dupe) {
    return NextResponse.json(
      { error: "Pseudonym bereits vergeben — bitte ein anderes wählen" },
      { status: 409 },
    );
  }

  // 4. Profil UPDATEn (Foto kommt separat vom Admin)
  const login_token = generateLoginToken();
  const { error: updErr } = await sb
    .from("profiles")
    .update({
      username,
      login_token,
      joined_at: new Date().toISOString(),
    })
    .eq("id", profile.id);
  if (updErr) {
    return NextResponse.json({ error: "DB-Update fehlgeschlagen: " + updErr.message }, { status: 500 });
  }

  // 6. Frau setzt Team-Namen (wenn noch leer)
  if (profile.gender === "f" && team_name) {
    const { data: team } = await sb
      .from("teams")
      .select("team_name")
      .eq("id", profile.team_id)
      .maybeSingle();
    if (!team?.team_name) {
      await sb.from("teams").update({ team_name }).eq("id", profile.team_id);
    }
  }

  // 7. Cookie + Antwort
  const c = await cookies();
  c.set(LOGIN_TOKEN_COOKIE, login_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({
    login_token,
    profile_id: profile.id,
    team_id: profile.team_id,
    gender: profile.gender,
    reused: false,
  });
}
