"use client";
import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { Confetti } from "@/components/Confetti";

interface Candidate {
  id: string;
  real_name: string;
}

interface Props {
  candidates: Candidate[];
  /** Wenn bereits in der DB als aufgelöst markiert: Pseudonym sofort zeigen, kein Konfetti */
  alreadyRevealed?: string | null;
}

export function PartnerGuessList({ candidates, alreadyRevealed = null }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [tried, setTried] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<{ id: string; username: string } | null>(
    alreadyRevealed ? { id: "", username: alreadyRevealed } : null,
  );
  const [confetti, setConfetti] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function guess(c: Candidate) {
    if (revealed || busy) return;
    setBusy(c.id);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/partner/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guessed_profile_id: c.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Fehler");
        return;
      }
      if (json.correct) {
        setRevealed({ id: c.id, username: json.revealed_name ?? "" });
        setConfetti(true);
      } else {
        setTried((p) => new Set(p).add(c.id));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section style={{ marginTop: 24 }}>
        <div className="section-head">
          <span className="kicker">Auflösen</span>
        </div>
        {revealed ? (
          <div
            className="card pad"
            style={{
              borderColor: "rgba(5,150,105,.45)",
              background: "var(--green-tint)",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", color: "var(--green-400)" }}>
              <CheckCircle2 size={32} />
            </div>
            <div className="h1" style={{ marginTop: 8, fontSize: 20 }}>
              Treffer! 🎉
            </div>
            <p className="t-small" style={{ marginTop: 6 }}>
              Dein geheimer Partner spielt unter dem Pseudonym
            </p>
            <div className="partner-name" style={{ marginTop: 8 }}>
              {revealed.username || "(noch keins)"}
            </div>
          </div>
        ) : (
          <>
            <p className="t-small" style={{ marginBottom: 12 }}>
              Wer von den Kandidat·innen ist es? Tippe auf „Auflösen&ldquo;.
              Bei Treffer gibt&apos;s Konfetti.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {candidates.map((c) => {
                const wasWrong = tried.has(c.id);
                return (
                  <div
                    key={c.id}
                    className="card pad"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      opacity: wasWrong ? 0.5 : 1,
                    }}
                  >
                    <span style={{ flex: 1, color: "var(--fg1)", fontSize: 15 }}>
                      {c.real_name}
                    </span>
                    {wasWrong ? (
                      <span
                        style={{
                          color: "var(--loss)",
                          fontSize: 12,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <X size={14} /> daneben
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: "auto", padding: "8px 14px", fontSize: 13 }}
                        onClick={() => guess(c)}
                        disabled={busy === c.id}
                      >
                        {busy === c.id ? "…" : "Auflösen"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {errorMsg && (
              <p style={{ color: "var(--loss)", fontSize: 13, marginTop: 8 }}>{errorMsg}</p>
            )}
          </>
        )}
      </section>
      {confetti && <Confetti onDone={() => setConfetti(false)} />}
    </>
  );
}
