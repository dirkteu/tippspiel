import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";

export async function GET() {
  try {
    const sb = supabaseService();
    const { error } = await sb.from("tournament_config").select("id").limit(1);
    if (error) {
      return NextResponse.json({ ok: false, db: false, error: error.message }, { status: 503 });
    }
    return NextResponse.json({ ok: true, db: true, ts: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 503 });
  }
}
