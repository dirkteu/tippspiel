import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseService } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";

const Body = z.object({
  image_data_url: z.string().startsWith("data:image/"),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Admin lädt Foto für einen Roster-Spieler hoch. */
export async function POST(req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Verboten" }, { status: 403 });
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const sb = supabaseService();

  // Profil existiert?
  const { data: profile } = await sb
    .from("profiles")
    .select("id,avatar_url")
    .eq("id", id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Spieler nicht gefunden" }, { status: 404 });
  }

  const match = parsed.data.image_data_url.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) {
    return NextResponse.json({ error: "Ungültiges Bildformat" }, { status: 400 });
  }
  const mime = match[1];
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.byteLength > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Foto zu groß (>2MB)" }, { status: 400 });
  }

  const path = `${profile.id}.${ext}`;
  const { error: upErr } = await sb.storage.from("avatars").upload(path, buffer, {
    contentType: mime,
    upsert: true,
  });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  await sb.from("profiles").update({ avatar_url: path }).eq("id", profile.id);

  return NextResponse.json({ ok: true, path });
}

/** Admin löscht das Foto eines Roster-Spielers. */
export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Verboten" }, { status: 403 });
  const { id } = await ctx.params;
  const sb = supabaseService();
  const { data: profile } = await sb
    .from("profiles")
    .select("avatar_url")
    .eq("id", id)
    .maybeSingle();
  if (profile?.avatar_url) {
    await sb.storage.from("avatars").remove([profile.avatar_url]);
  }
  await sb.from("profiles").update({ avatar_url: null }).eq("id", id);
  return NextResponse.json({ ok: true });
}
