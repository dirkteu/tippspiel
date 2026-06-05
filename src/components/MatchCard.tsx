"use client";
import { useEffect, useState } from "react";
import { Check, Lock, Pencil } from "lucide-react";

export interface MatchInfo {
  id: string;
  /** Erste, fett dargestellte Hälfte des Meta-Headers, z.B. "Gruppe E" */
  meta_primary: string;
  /** Zweite Hälfte, z.B. "14. Juni · 19:00 Uhr" */
  meta_secondary: string;
  kickoff: string; // ISO
  team_1: string;
  team_2: string;
  flag_1?: string | null;
  flag_2?: string | null;
  stadium?: string | null;
  locked: boolean;
}

export interface TipState {
  tip_1: number;
  tip_2: number;
  saved: boolean;
  points?: number | null;
}

interface Props {
  match: MatchInfo;
  tip: TipState | null;
  onChange?: (t: { tip_1: number; tip_2: number }) => void;
  /**
   * Wird gerufen, wenn der User auf "Bearbeiten" tippt (nur sichtbar, wenn
   * Tipp bereits gespeichert + nicht gesperrt).
   */
  onEdit?: () => void;
}

export function MatchCard({ match, tip, onChange, onEdit }: Props) {
  const t = tip ?? { tip_1: 0, tip_2: 0, saved: false };
  // Tipp gespeichert + nicht gesperrt = "grau", Steppers aus, Bearbeiten-Button.
  const lockedForEdit = t.saved && !match.locked;
  const disabled = match.locked || !onChange || lockedForEdit;

  return (
    <div
      className={`card match${t.saved ? " saved" : ""}${lockedForEdit ? " readonly" : ""}`}
    >
      <div className="top">
        <span className="meta">
          <strong style={{ color: "var(--fg1)", fontWeight: 700 }}>
            {match.meta_primary}
          </strong>
          {match.meta_secondary && (
            <>
              {" · "}
              <strong style={{ color: "var(--fg2)", fontWeight: 700 }}>
                {match.meta_secondary}
              </strong>
            </>
          )}
        </span>
        {match.locked ? (
          <span className="locked-pill">
            <Lock size={11} /> gesperrt
          </span>
        ) : (
          <Countdown kickoff={match.kickoff} />
        )}
      </div>
      <div className="teams">
        <div className="team">
          <span className="flag">{match.flag_1 ?? "🏳️"}</span>
          <span className="tn">{match.team_1}</span>
        </div>
        <div className="stepper">
          <div className="pm">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange?.({ tip_1: t.tip_1 + 1, tip_2: t.tip_2 })}
              aria-label="plus Heim"
            >
              +
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange?.({ tip_1: Math.max(0, t.tip_1 - 1), tip_2: t.tip_2 })}
              aria-label="minus Heim"
            >
              −
            </button>
          </div>
          <span className="num">{t.tip_1}</span>
          <span className="colon">:</span>
          <span className="num">{t.tip_2}</span>
          <div className="pm">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange?.({ tip_1: t.tip_1, tip_2: t.tip_2 + 1 })}
              aria-label="plus Auswärts"
            >
              +
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange?.({ tip_1: t.tip_1, tip_2: Math.max(0, t.tip_2 - 1) })}
              aria-label="minus Auswärts"
            >
              −
            </button>
          </div>
        </div>
        <div className="team">
          <span className="flag">{match.flag_2 ?? "🏳️"}</span>
          <span className="tn">{match.team_2}</span>
        </div>
      </div>
      {match.stadium && (
        <div className="lb-sub" style={{ marginTop: 10, textAlign: "center", fontSize: 11 }}>
          📍 <strong style={{ color: "var(--fg2)", fontWeight: 700 }}>{match.stadium}</strong>
        </div>
      )}
      {t.saved && (
        <div
          className="tip-flag"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Check size={15} />
            {typeof t.points === "number" ? `Gewertet · ${t.points} Pkt` : "Tipp gespeichert"}
          </span>
          {lockedForEdit && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-ghost"
              style={{
                width: "auto",
                padding: "6px 12px",
                fontSize: 12,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Pencil size={12} /> Bearbeiten
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Countdown({ kickoff }: { kickoff: string }) {
  const [text, setText] = useState<string>("");
  useEffect(() => {
    function tick() {
      const lock = new Date(kickoff).getTime() - 5 * 60_000;
      const diff = lock - Date.now();
      if (diff <= 0) {
        setText("gleich gesperrt");
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      if (h > 24) setText(`in ${Math.floor(h / 24)} T`);
      else if (h > 0) setText(`in ${h}h ${m}m`);
      else setText(`in ${m} Min`);
    }
    tick();
    const i = setInterval(tick, 30_000);
    return () => clearInterval(i);
  }, [kickoff]);
  return <span className="countdown-pill">{text}</span>;
}
