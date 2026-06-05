import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getSession } from "@/lib/auth";

export default async function WelcomePage() {
  const session = await getSession();
  if (session) redirect("/spieltag");

  return (
    <div className="shell">
      <div className="screen">
        <div
          className="scroll"
          style={{ display: "flex", flexDirection: "column", padding: "0 24px 40px" }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 22,
              textAlign: "center",
              minHeight: "70vh",
            }}
          >
            <img
              src="/logo.png"
              alt="Bülser Alm"
              width={96}
              height={96}
              style={{ display: "block", objectFit: "contain" }}
            />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 34,
                  letterSpacing: "-.02em",
                  color: "var(--fg1)",
                }}
              >
                BÜLSER <span style={{ color: "var(--green-500)" }}>ALM</span>
              </div>
              <p className="t-body" style={{ marginTop: 10, maxWidth: 280 }}>
                Tippe die WM 2026 mit deinem geheimen Partner. Jeder Volltreffer
                deckt eine Kachel auf — wer steckt dahinter?
              </p>
            </div>

            <div className="grid3" style={{ width: 180, height: 180, marginTop: 4 }}>
              <div
                className="photo"
                style={{ fontSize: 90, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ⚽
              </div>
              <div className="tiles">
                {[1, 0, 1, 0, 1, 1, 0, 1, 0].map((v, i) => (
                  <div key={i} className={`tile${v ? "" : " open"}`}>
                    <Lock size={18} />
                  </div>
                ))}
              </div>
            </div>

            <p className="t-small" style={{ maxWidth: 280, marginTop: 8 }}>
              Du brauchst einen WhatsApp-Link von deinem Squad-Admin, um
              loszulegen.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/admin" className="btn btn-ghost" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              Admin-Bereich
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
