"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  code: string;
  username: string | null;
}

/**
 * Wenn der Spieler seinen Invite-Link in einem anderen Browser/Inkognito
 * öffnet und bereits beigetreten ist, kein Pseudonym-Formular mehr —
 * stattdessen automatisch /api/profiles/create mit nur dem invite_code
 * aufrufen. Die API liefert den bestehenden login_token zurück und setzt
 * den Cookie (siehe route.ts, Schritt 2 "Bereits beigetreten").
 */
export function AutoRelogin({ code, username }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    // StrictMode-Doppelfeuer verhindern
    if (ran.current) return;
    ran.current = true;
    relogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function relogin() {
    setError(null);
    try {
      const res = await fetch("/api/profiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Anmeldung fehlgeschlagen");
        return;
      }
      router.replace("/spieltag");
    } catch {
      setError("Netzwerkfehler");
    }
  }

  return (
    <div
      className="scroll"
      style={{ padding: "0 24px 40px", display: "flex", flexDirection: "column" }}
    >
      <span className="kicker" style={{ marginTop: 32 }}>Willkommen zurück</span>
      <h1 className="h1" style={{ marginTop: 6 }}>
        {username ?? "Anmelden"}
      </h1>
      {!error ? (
        <p className="t-small" style={{ marginTop: 16, color: "var(--fg3)" }}>
          Du wirst angemeldet…
        </p>
      ) : (
        <>
          <p style={{ color: "var(--loss)", marginTop: 16, fontSize: 14 }}>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => {
              ran.current = false;
              relogin();
            }}
          >
            Erneut versuchen
          </button>
        </>
      )}
    </div>
  );
}
