import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Cookie-Pfad-Migration: liest sq_admin (alter path=/admin) und re-setzt ihn
 * mit path=/, damit /api/admin/* den Cookie auch bekommt.
 * Dieser Pfad startet mit /admin, daher wird der alte Cookie noch gesendet.
 */
export async function GET() {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "Admin nicht konfiguriert" }, { status: 500 });
  }
  const c = await cookies();
  const got = c.get("sq_admin")?.value;
  if (got !== expected) {
    return NextResponse.json({ ok: false, authed: false });
  }
  c.set("sq_admin", expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return NextResponse.json({ ok: true });
}
