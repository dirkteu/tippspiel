"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  partnerGender: "m" | "f";
}

export function PartnerGuessList({ candidates, alreadyRevealed = null, partnerGender }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [tried, setTried] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<{ id: string; username: string } | null>(
    alreadyRevealed ? { id: "", username: alreadyRevealed } : null,
  );
  const [confetti, setConfetti] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function guess(c: Candidate) {
    if (revealed || busy) return;
    setBusy(c.id);
    setErrorMsg(null);
    setHint(null);
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
        // Server-Render erneuern, damit Kacheln/Bild voll sichtbar werden.
        router.refresh();
      } else {
        setTried((p) => new Set(p).add(c.id));
        setHint("Daneben — eine Kachel kommt zurück.");
        // Kacheln im Hintergrund neu rendern (effectiveOpen sinkt).
        router.refresh();
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
              {partnerGender === "f"
                ? "Deine geheime Nachbarin spielt unter dem Pseudonym"
                : "Dein geheimer Nachbar spielt unter dem Pseudonym"}
            </p>
            <div className="partner-name" style={{ marginTop: 8 }}>
              {revealed.username || "(noch keins)"}
            </div>
          </div>
        ) : (
          <>
            <p className="t-small" style={{ marginBottom: 12 }}>
              Wer ist es? Tippe auf einen Namen. Bei Treffer gibt&apos;s Konfetti,
              daneben kostet eine Kachel.
            </p>
            <div className="card guess-list">
              {candidates.map((c) => {
                const wasWrong = tried.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="guess-row"
                    onClick={() => guess(c)}
                    disabled={wasWrong || busy === c.id}
                  >
                    <span className="guess-name">{c.real_name}</span>
                    {wasWrong ? (
                      <span className="guess-miss">
                        <X size={14} /> daneben
                      </span>
                    ) : busy === c.id ? (
                      <span className="guess-busy">…</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {hint && (
              <p style={{ color: "var(--gold)", fontSize: 13, marginTop: 10 }}>{hint}</p>
            )}
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
