"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Award, Info } from "lucide-react";
import { AppBar } from "@/components/primitives/AppBar";
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

const SAVE_DEBOUNCE_MS = 600;

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pro Match-ID ein Debounce-Timer, damit +/− Klicks gebündelt werden.
  const matchTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const championTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bei Unmount alle Timer aufräumen.
  useEffect(() => {
    const timers = matchTimers.current;
    return () => {
      for (const h of timers.values()) clearTimeout(h);
      if (championTimer.current) clearTimeout(championTimer.current);
    };
  }, []);

  const openMatches = initial.matches.filter((m) => !m.locked);
  const lockedMatches = initial.matches.filter((m) => m.locked);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }

  function setMatch(id: string, t: { tip_1: number; tip_2: number }) {
    setState((p) => ({
      ...p,
      [id]: { tip_1: t.tip_1, tip_2: t.tip_2, saved: false, points: p[id]?.points ?? null },
    }));
    // Debounced Auto-Save: jeden +/- Klick auf 600ms hinauszögern.
    const existing = matchTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const handle = setTimeout(() => saveMatch(id, t), SAVE_DEBOUNCE_MS);
    matchTimers.current.set(id, handle);
  }

  function editMatch(id: string) {
    // "Bearbeiten" → lokal als ungespeichert markieren, Werte bleiben.
    // Erst der nächste +/- Klick löst dann auch wieder einen Save aus.
    setState((p) => ({
      ...p,
      [id]: { ...p[id], saved: false },
    }));
  }

  async function saveMatch(id: string, t: { tip_1: number; tip_2: number }) {
    setErrors((p) => {
      if (!(id in p)) return p;
      const next = { ...p };
      delete next[id];
      return next;
    });
    try {
      const res = await fetch("/api/tips/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tips: [{ match_id: id, tip_1: t.tip_1, tip_2: t.tip_2 }],
        }),
      });
      const json = await res.json();
      const result = json.results?.[0] as
        | { match_id: string; ok: boolean; error?: string }
        | undefined;
      if (res.ok && result?.ok) {
        setState((p) => ({ ...p, [id]: { ...p[id], saved: true } }));
        showToast("Tipp gespeichert");
      } else {
        setErrors((p) => ({ ...p, [id]: result?.error ?? "Speichern fehlgeschlagen" }));
      }
    } catch {
      setErrors((p) => ({ ...p, [id]: "Netzwerkfehler" }));
    }
  }

  function setChampionDebounced(name: string) {
    setChampion(name);
    setSavedChampion(false);
    if (initial.championLocked) return;
    if (championTimer.current) clearTimeout(championTimer.current);
    championTimer.current = setTimeout(() => saveChampion(name), SAVE_DEBOUNCE_MS);
  }

  async function saveChampion(name: string) {
    if (!name) return;
    try {
      const res = await fetch("/api/tips/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tips: [], champion: name }),
      });
      const json = await res.json();
      if (res.ok && json.champion?.ok) {
        setSavedChampion(true);
        showToast("Weltmeister-Tipp gespeichert");
      } else {
        showToast(json.champion?.error ?? "Weltmeister-Tipp fehlgeschlagen");
      }
    } catch {
      showToast("Netzwerkfehler");
    }
  }

  return (
    <>
      <div className="scroll">
        <AppBar
          action={
            <Link href="/regeln" className="icon-btn" aria-label="Tipp-Regeln">
              <Info size={19} />
            </Link>
          }
        />
        <span className="kicker">Deine Tipps</span>
        <h1 className="h1" style={{ marginTop: 4 }}>Spieltag-Übersicht</h1>
        <p className="t-small" style={{ marginTop: 6, marginBottom: 8 }}>
          Tipps werden automatisch gespeichert — kein Klick nötig.
        </p>

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
            onChange={(e) => setChampionDebounced(e.target.value)}
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
              onEdit={() => editMatch(m.id)}
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

      <Toast show={!!toast}>{toast}</Toast>
    </>
  );
}
