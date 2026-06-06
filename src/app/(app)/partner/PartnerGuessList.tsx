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
  /** Bereits aufgeloest — entweder per Treffer (partner_revealed_at)
   *  oder weil alle 9 Kacheln durch Trigger gefallen sind und das Foto
   *  voll sichtbar ist. In beiden Faellen wird die Treffer-Box gezeigt
   *  und die Auswahlliste ausgeblendet. */
  isRevealed?: boolean;
  partnerGender: "m" | "f";
  /** Name des Teams (von beiden Mitgliedern gemeinsam vergeben). */
  teamName: string | null;
  /** Pseudonym des Partners — kann fehlen, wenn er sich noch nicht eingeloggt hat. */
  partnerPseudonym: string | null;
}

export function PartnerGuessList({
  candidates,
  isRevealed = false,
  partnerGender,
  teamName,
  partnerPseudonym,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [tried, setTried] = useState<Set<string>>(new Set());
  const [revealedLocal, setRevealedLocal] = useState<boolean>(false);
  const revealed = isRevealed || revealedLocal;
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
        setRevealedLocal(true);
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
            {partnerPseudonym && (
              <>
                <p className="t-small" style={{ marginTop: 10 }}>
                  {partnerGender === "f"
                    ? "Deine geheime Nachbarin spielt unter dem Pseudonym"
                    : "Dein geheimer Nachbar spielt unter dem Pseudonym"}
                </p>
                <div className="partner-name" style={{ marginTop: 4 }}>
                  {partnerPseudonym}
                </div>
              </>
            )}
            <p className="t-small" style={{ marginTop: 14, lineHeight: 1.5 }}>
              {partnerPseudonym && teamName ? (
                <>Du und <strong style={{ color: "var(--fg1)" }}>{partnerPseudonym}</strong> bildet das Team <strong style={{ color: "var(--fg1)" }}>{teamName}</strong>.</>
              ) : teamName ? (
                <>Ihr bildet zusammen das Team <strong style={{ color: "var(--fg1)" }}>{teamName}</strong>.</>
              ) : partnerPseudonym ? (
                <>Du und <strong style={{ color: "var(--fg1)" }}>{partnerPseudonym}</strong> bildet zusammen ein Team.</>
              ) : (
                <>Ihr bildet zusammen ein Team.</>
              )}
              <br />
              Viel Erfolg!
            </p>
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
