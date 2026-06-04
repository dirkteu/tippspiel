import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  if (!session?.profile.avatar_url) {
    return new NextResponse(null, { status: 404 });
  }
  return streamAvatar(session.profile.avatar_url);
}

export async function streamAvatar(path: string) {
  const sb = supabaseService();
  const { data, error } = await sb.storage.from("avatars").download(path);
  if (error || !data) {
    return new NextResponse(null, { status: 404 });
  }
  const buf = Buffer.from(await data.arrayBuffer());
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": data.type || "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}
