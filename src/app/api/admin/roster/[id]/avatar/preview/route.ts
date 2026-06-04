import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Avatar-Preview für Admin (umgeht das anonyme /api/avatar/*). */
export async function GET(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return new NextResponse(null, { status: 403 });
  const { id } = await ctx.params;
  const sb = supabaseService();
  const { data: profile } = await sb
    .from("profiles")
    .select("avatar_url")
    .eq("id", id)
    .maybeSingle();
  if (!profile?.avatar_url) return new NextResponse(null, { status: 404 });
  const { data } = await sb.storage.from("avatars").download(profile.avatar_url);
  if (!data) return new NextResponse(null, { status: 404 });
  const buf = Buffer.from(await data.arrayBuffer());
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": data.type || "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}
