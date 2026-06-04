import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseService } from "@/lib/supabase/server";
import { AdminLogin } from "./AdminLogin";
import { AdminPanel } from "./AdminPanel";

const ADMIN_COOKIE = "sq_admin";

export default async function AdminPage() {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return (
      <div className="shell">
        <div className="screen">
          <div className="scroll" style={{ padding: 24 }}>
            <h1 className="h1">Admin nicht konfiguriert</h1>
            <p className="t-body" style={{ marginTop: 8 }}>
              Setze <code>ADMIN_PASSWORD</code> in <code>.env</code> und neu starten.
            </p>
          </div>
        </div>
      </div>
    );
  }
  const c = await cookies();
  const got = c.get(ADMIN_COOKIE)?.value;
  if (got !== expected) {
    return (
      <div className="shell">
        <div className="screen">
          <AdminLogin />
        </div>
      </div>
    );
  }
  const sb = supabaseService();
  const [teamsRes, matchesRes, configRes, rosterRes] = await Promise.all([
    sb.from("teams").select("id,team_name").order("created_at", { ascending: false }),
    sb.from("matches").select("*").order("match_date", { ascending: true }),
    sb.from("tournament_config").select("*").eq("id", 1).maybeSingle(),
    sb
      .from("profiles")
      .select(
        "id,real_name,gender,real_partner_id,invite_code,team_id,joined_at,username",
      )
      .order("real_name", { ascending: true }),
  ]);
  return (
    <div className="shell">
      <div className="screen">
        <AdminPanel
          roster={rosterRes.data ?? []}
          teams={teamsRes.data ?? []}
          matches={matchesRes.data ?? []}
          config={configRes.data ?? null}
        />
      </div>
    </div>
  );
}

export async function loginAction(formData: FormData) {
  "use server";
  const expected = process.env.ADMIN_PASSWORD;
  const password = String(formData.get("password") ?? "");
  if (!expected || password !== expected) {
    redirect("/admin?error=1");
  }
  const c = await cookies();
  c.set(ADMIN_COOKIE, expected, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin");
}
