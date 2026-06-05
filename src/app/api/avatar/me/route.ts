import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";

export const PLACEHOLDER_SVG = `
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <circle cx="100" cy="100" r="100" fill="#1e293b"/>
  <circle cx="100" cy="85" r="45" fill="#64748b"/>
  <path d="M30 170C30 140 60 125 100 125C140 125 170 140 170 170" stroke="#64748b" stroke-width="20" stroke-linecap="round" fill="none"/>
</svg>`.trim();

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.profile.id) return new NextResponse(PLACEHOLDER_SVG, { headers: { "Content-Type": "image/svg+xml" } });

    const sb = supabaseService();
    const { data: profile } = await sb.from("profiles").select("avatar_url").eq("id", session.profile.id).single();

    if (!profile?.avatar_url) return new NextResponse(PLACEHOLDER_SVG, { headers: { "Content-Type": "image/svg+xml" } });
    return streamAvatar(profile.avatar_url);
  } catch (e) {
    return new NextResponse(PLACEHOLDER_SVG, { headers: { "Content-Type": "image/svg+xml" } });
  }
}

export async function streamAvatar(path: string) {
  try {
    const sb = supabaseService();
    const { data, error } = await sb.storage.from("avatars").download(path);
    if (error || !data) return new NextResponse(PLACEHOLDER_SVG, { headers: { "Content-Type": "image/svg+xml" } });
    const buf = Buffer.from(await data.arrayBuffer());
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": data.type || "image/jpeg", "Cache-Control": "private, max-age=300" },
    });
  } catch (e) {
    return new NextResponse(PLACEHOLDER_SVG, { headers: { "Content-Type": "image/svg+xml" } });
  }
}
