"use client";
import { useState } from "react";
import { Award } from "lucide-react";
import { AppBar } from "@/components/primitives/AppBar";
import { Button } from "@/components/primitives/Button";
import { MatchCard, type MatchInfo, type TipState } from "@/components/MatchCard";
import { Toast } from "@/components/primitives/Toast";
import { WM2026_TEAMS } from "@/lib/teams-wm2026";

export interface TippsInitial {
  matches: MatchInfo[];
  tips: Record<string, { tip_1: number; tip_2: number; points: number | null }>;
  championTip: string | null;
  championLocked: boolean;
  championLockAt: string;
}

export function TippsClient({ initial }: { initial: TippsInitial }) {
  const [state, setState] = useState<Record<string, TipState>>(() => {
    const out: Record<string, TipState> = {};
    for (const m of initial.matches) {
      const t = initial.tips[m.id];
      out[m.id] = t
        ? { tip_1: t.tip_1, tip_2: t.tip_2, saved: true, points: t.points }
        : { tip_1: 0, tip_2: 0, saved: false };
    }
    return out;
  });
  const [champion, setChampion] = useState<string>(initial.championTip ?? "");
  const [savedChampion, setSavedChampion] = useState<boolean>(!!initial.championTip);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const openMatches = initial.matches.filter((m) => !m.locked);
  const lockedMatches = initial.matches.filter((m) => m.locked);

  function setMatch(id: string, t: { tip_1: number; tip_2: number }) {
    setState((p) => ({
      ...p,
      [id]: { tip_1: t.tip_1, tip_2: t.tip_2, saved: false, points: p[id]?.points ?? null },
    }));
  }

  async function saveAll() {
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        tips: openMatches.map((m) => ({
          match_id: m.id,
          tip_1: state[m.id].tip_1,
          tip_2: state[m.id].tip_2,
        })),
        champion: !initial.championLocked && champion ? champion : undefined,
      };
      const res = await fetch("/api/tips/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setToast("Speichern fehlgeschlagen");
        setTimeout(() => setToast(null), 2200);
        setSaving(false);
        return;
      }
      const newErrors: Record<string, string> = {};
      const ok = new Set<string>();
      for (const r of json.results as { match_id: string; ok: boolean; error?: string }[]) {
        if (r.ok) ok.add(r.match_id);
        else newErrors[r.match_id] = r.error ?? "Fehler";
      }
      setState((p) => {
        const next = { ...p };
        for (const m of openMatches) {
          if (ok.has(m.id)) next[m.id] = { ...p[m.id], saved: true };
        }
        return next;
      });
      if (json.champion?.ok) setSavedChampion(true);
      setErrors(newErrors);
      setToast(`${ok.size} Tipp${ok.size === 1 ? "" : "s"} gespeichert`);
      setTimeout(() => setToast(null), 2200);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="scroll">
        <AppBar />
        <span className="kicker">Deine Tipps</span>
        <h1 className="h1" style={{ marginTop: 4 }}>Spieltag-Übersicht</h1>

        {/* Weltmeister-Tipp */}
        <div className="champion-card" style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span className="kicker" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Award size={14} /> Mein Weltmeister
            </span>
            <span className="points-badge">+10 Pkt</span>
          </div>
          <select
            value={champion}
            onChange={(e) => {
              setChampion(e.target.value);
              setSavedChampion(false);
            }}
            disabled={initial.championLocked}
          >
            <option value="">– wähle ein Team –</option>
            {WM2026_TEAMS.map((t) => (
              <option key={t.name} value={t.name}>
                {t.flag} {t.name}
              </option>
            ))}
          </select>
          <p className="t-small" style={{ marginTop: 8 }}>
            {initial.championLocked
              ? "Sperrfrist überschritten — dein Tipp ist fix."
              : `Du kannst deinen Tipp bis ${new Date(initial.championLockAt).toLocaleString("de-DE")} ändern.`}
          </p>
          {savedChampion && champion && (
            <div className="tip-flag"><Award size={15} /> Weltmeister-Tipp gespeichert</div>
          )}
        </div>

        {openMatches.length === 0 && (
          <p className="t-small" style={{ marginTop: 24 }}>Keine offenen Spiele.</p>
        )}

        {openMatches.map((m) => (
          <div key={m.id}>
            <MatchCard
              match={m}
              tip={state[m.id]}
              onChange={(t) => setMatch(m.id, t)}
            />
            {errors[m.id] && (
              <div style={{ color: "var(--loss)", fontSize: 12, padding: "0 8px 12px" }}>
                {errors[m.id]}
              </div>
            )}
          </div>
        ))}

        {lockedMatches.length > 0 && (
          <>
            <div className="section-head">
              <span className="kicker">Gesperrte Spiele</span>
            </div>
            {lockedMatches.map((m) => (
              <MatchCard key={m.id} match={m} tip={state[m.id]} />
            ))}
          </>
        )}
      </div>

      <div className="savebar">
        <div className="wrap">
          <Button variant="primary" onClick={saveAll} disabled={saving}>
            {saving ? "Speichere…" : "Tipps speichern"}
          </Button>
        </div>
      </div>
      <Toast show={!!toast}>{toast}</Toast>
    </>
  );
}
