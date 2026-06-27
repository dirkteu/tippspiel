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
  championLockAt: string | null;
  championAlreadySet: boolean;
}

const SAVE_DEBOUNCE_MS = 3000;
const TOAST_THROTTLE_MS = 4000;

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
  // Der Weltmeister-Tipp ist einmalig & final (DB-Trigger) — daher KEIN
  // Debounce-Autosave, sondern expliziter Button mit Bestätigung.
  const [championFinal, setChampionFinal] = useState<boolean>(initial.championAlreadySet);
  const [championBusy, setChampionBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pro Match-ID ein Debounce-Timer, damit +/− Klicks gebündelt werden.
  const matchTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Noch nicht persistierte Tipps — wird beim Tab-Close per sendBeacon geflusht.
  const pending = useRef<Map<string, { tip_1: number; tip_2: number }>>(new Map());
  const lastToastAt = useRef<number>(0);

  // Bei Unmount alle Timer aufräumen.
  useEffect(() => {
    const timers = matchTimers.current;
    return () => {
      for (const h of timers.values()) clearTimeout(h);
    };
  }, []);

  // Safety-Flush: Tab schließen oder in den Hintergrund schicken → noch pending
  // markierte Tipps per navigator.sendBeacon nachsenden, damit nichts verloren geht.
  useEffect(() => {
    function flushPending() {
      const tips = Array.from(pending.current, ([match_id, v]) => ({
        match_id,
        tip_1: v.tip_1,
        tip_2: v.tip_2,
      }));
      if (tips.length === 0) return;
      const body: { tips: typeof tips } = { tips };
      try {
        const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
        navigator.sendBeacon("/api/tips/bulk", blob);
      } catch {
        /* ignore — Best-Effort beim Verlassen */
      }
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flushPending();
    }
    window.addEventListener("beforeunload", flushPending);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flushPending);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const openMatches = initial.matches.filter((m) => !m.locked);
  const lockedMatches = initial.matches.filter((m) => m.locked);

  function showToast(msg: string) {
    // Throttle: bei vielen Saves in Folge nur einmal pro 4 s einen Toast.
    const now = Date.now();
    if (now - lastToastAt.current < TOAST_THROTTLE_MS) return;
    lastToastAt.current = now;
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }

  function setMatch(id: string, t: { tip_1: number; tip_2: number }) {
    setState((p) => ({
      ...p,
      [id]: { tip_1: t.tip_1, tip_2: t.tip_2, saved: false, points: p[id]?.points ?? null },
    }));
    // Wert als pending markieren, damit der Safety-Flush ihn beim Tab-Close kennt.
    pending.current.set(id, t);
    // Debounced Auto-Save: jeden +/- Klick auf SAVE_DEBOUNCE_MS hinauszögern.
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
        pending.current.delete(id);
        showToast("Tipp gespeichert");
      } else {
        setErrors((p) => ({ ...p, [id]: result?.error ?? "Speichern fehlgeschlagen" }));
      }
    } catch {
      setErrors((p) => ({ ...p, [id]: "Netzwerkfehler" }));
    }
  }

  async function confirmAndSaveChampion() {
    if (!champion || championBusy || championFinal || initial.championLocked) return;
    const sure = window.confirm(
      `${champion} als deinen Weltmeister setzen?\n\nAchtung: Der Tipp ist EINMALIG und kann danach nicht mehr geändert werden.`,
    );
    if (!sure) return;
    setChampionBusy(true);
    try {
      const res = await fetch("/api/tips/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tips: [], champion }),
      });
      const json = await res.json();
      if (res.ok && json.champion?.ok) {
        setSavedChampion(true);
        setChampionFinal(true);
        showToast("Weltmeister-Tipp gespeichert");
      } else {
        showToast(json.champion?.error ?? "Weltmeister-Tipp fehlgeschlagen");
      }
    } catch {
      showToast("Netzwerkfehler");
    } finally {
      setChampionBusy(false);
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
            onChange={(e) => {
              setChampion(e.target.value);
              setSavedChampion(false);
            }}
            disabled={initial.championLocked || championFinal}
          >
            <option value="">– wähle ein Team –</option>
            {WM2026_TEAMS.map((t) => (
              <option key={t.name} value={t.name}>
                {t.flag} {t.name}
              </option>
            ))}
            {/* Bereits gesetzter Tipp auf ein Team, das nicht (mehr) in der
                Liste steht — sonst zeigt das Select fälschlich den Platzhalter. */}
            {champion && !WM2026_TEAMS.some((t) => t.name === champion) && (
              <option value={champion}>{champion}</option>
            )}
          </select>
          {!championFinal && !initial.championLocked && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 10 }}
              onClick={confirmAndSaveChampion}
              disabled={!champion || championBusy}
            >
              {championBusy ? "Speichere…" : "Weltmeister final setzen"}
            </button>
          )}
          <p className="t-small" style={{ marginTop: 8 }}>
            {championFinal
              ? "Dein Weltmeister-Tipp ist final — kann nicht mehr geändert werden."
              : initial.championLocked
              ? "Sperrfrist überschritten — dein Tipp ist fix."
              : initial.championLockAt
              ? `Du kannst deinen Tipp einmalig bis ${new Date(initial.championLockAt).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })} Uhr setzen — danach ist er final.`
              : "Du kannst deinen Tipp einmalig setzen — Sperrfrist beginnt mit den KO-Spielen."}
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
