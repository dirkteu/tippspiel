"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  Copy,
  Dice5,
  Lock,
  Menu,
  Plus,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { WM2026_TEAMS } from "@/lib/teams-wm2026";

/* =========================================================================
   AdminPanel — Foto-Flow Variante
   - Roster pflegen (Spieler + Partner)
   - Avatar pro Spieler hochladen (Datei-Picker, 2MB max, Preview & Delete)
   - Teams würfeln
   - Spiele pflegen (Stadium-Feld, Round-Auswahl)
   - Ergebnis-Block per Match (sauber abgesetzt — #24)
   - Weltmeister setzen
   ========================================================================= */

// ---------------------------------------------------------------- Types -----

interface RosterPlayer {
  id: string;
  real_name: string | null;
  gender: "m" | "f";
  real_partner_id: string | null;
  invite_code: string | null;
  team_id: string | null;
  joined_at: string | null;
  username: string | null;
  avatar_url?: string | null;
}

interface Team {
  id: string;
  team_name: string | null;
}

interface Match {
  id: string;
  group_name: string | null;
  round: "group" | "r32" | "r16" | "qf" | "sf" | "3rd" | "final";
  team_1: string;
  team_2: string;
  flag_1: string | null;
  flag_2: string | null;
  match_date: string;
  locked_at: string | null;
  result_1: number | null;
  result_2: number | null;
  stadium: string | null;
}

interface TournamentConfig {
  id: number;
  champion_lock_at: string;
  official_champion: string | null;
}

interface Props {
  roster: RosterPlayer[];
  teams: Team[];
  matches: Match[];
  config: TournamentConfig | null;
}

// ---------------------------------------------------------- Konstanten -----

const ROUND_LABEL: Record<Match["round"], string> = {
  group: "Gruppenphase",
  r32: "Sechzehntelfinale",
  r16: "Achtelfinale",
  qf: "Viertelfinale",
  sf: "Halbfinale",
  "3rd": "Spiel um Platz 3",
  final: "Finale",
};
const ROUND_ORDER: Match["round"][] = ["group", "r32", "r16", "qf", "sf", "3rd", "final"];

// ---------------------------------------------------------- Helpers --------

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function toDatetimeLocal(iso: string): string {
  // ISO → "YYYY-MM-DDTHH:MM" für <input type="datetime-local">
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(local: string): string {
  // "YYYY-MM-DDTHH:MM" → ISO mit Offset (lokal interpretiert)
  return new Date(local).toISOString();
}

// ====================================================== AdminPanel =========

type AdminTab = "A" | "B" | "C";
const TAB_TITLES: Record<AdminTab, string> = {
  A: "Roster & Teams",
  B: "Spiele",
  C: "Einstellungen",
};

export function AdminPanel({ roster, teams, matches, config }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("A");
  const [menuOpen, setMenuOpen] = useState(false);

  const refresh = () => router.refresh();

  function logout() {
    document.cookie = "sq_admin=; Max-Age=0; path=/";
    document.cookie = "sq_admin=; Max-Age=0; path=/admin";
    router.refresh();
  }

  function pickTab(next: AdminTab) {
    setTab(next);
    setMenuOpen(false);
  }

  return (
    <div className="scroll" style={{ padding: "0 20px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22, gap: 12 }}>
        <button
          type="button"
          className="icon-btn"
          aria-label="Menü"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Menu size={19} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="kicker">Admin</span>
          <h1 className="h1" style={{ marginTop: 2, fontSize: 22 }}>
            {TAB_TITLES[tab]}
          </h1>
        </div>
        <button
          className="btn btn-ghost"
          style={{ width: "auto", padding: "8px 14px", fontSize: 13 }}
          onClick={logout}
        >
          Abmelden
        </button>
      </div>

      {menuOpen && (
        <div
          className="card pad"
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            background: "var(--bg-elevated)",
          }}
        >
          {(["A", "B", "C"] as AdminTab[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => pickTab(k)}
              className={`btn ${tab === k ? "btn-primary" : "btn-ghost"}`}
              style={{
                justifyContent: "flex-start",
                textAlign: "left",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: tab === k ? "rgba(255,255,255,.18)" : "var(--surface-2)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {k}
              </span>
              {TAB_TITLES[k]}
            </button>
          ))}
        </div>
      )}

      {tab === "A" && (
        <>
          <RosterSection roster={roster} onChange={refresh} />
          <TeamsSection teams={teams} roster={roster} onChange={refresh} />
        </>
      )}
      {tab === "B" && <MatchesSection matches={matches} onChange={refresh} />}
      {tab === "C" && <ConfigSection config={config} onChange={refresh} />}
    </div>
  );
}

// ====================================================== Roster ============

function RosterSection({
  roster,
  onChange,
}: {
  roster: RosterPlayer[];
  onChange: () => void;
}) {
  return (
    <section>
      <div className="section-head">
        <span className="kicker">Roster · {roster.length} Spieler</span>
      </div>
      <NewPlayerForm roster={roster} onCreated={onChange} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {roster.map((p) => (
          <PlayerCard key={p.id} player={p} roster={roster} onChange={onChange} />
        ))}
        {roster.length === 0 && (
          <p className="t-small" style={{ color: "var(--fg4)", marginTop: 8 }}>
            Noch keine Spieler — füge welche hinzu.
          </p>
        )}
      </div>
    </section>
  );
}

function NewPlayerForm({
  roster,
  onCreated,
}: {
  roster: RosterPlayer[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"m" | "f">("m");
  const [partnerId, setPartnerId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Mögliche Partner: anderes Geschlecht, noch kein echter Partner verknüpft
  const partnerOptions = useMemo(() => {
    const wanted = gender === "m" ? "f" : "m";
    return roster.filter((p) => p.gender === wanted && p.real_partner_id == null);
  }, [roster, gender]);

  async function submit() {
    if (name.trim().length < 1) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          real_name: name.trim(),
          gender,
          real_partner_id: partnerId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error ?? "Fehler beim Anlegen");
        return;
      }
      setName("");
      setPartnerId("");
      setOpen(false);
      onCreated();
    } catch {
      setErr("Netzwerkfehler");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        className="btn btn-secondary"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => setOpen(true)}
      >
        <UserPlus size={18} /> Spieler hinzufügen
      </button>
    );
  }

  return (
    <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        className="field-input"
        placeholder="Echter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className={`btn ${gender === "m" ? "btn-primary" : "btn-ghost"}`}
          style={{ flex: 1, padding: "12px" }}
          onClick={() => setGender("m")}
        >
          Mann
        </button>
        <button
          type="button"
          className={`btn ${gender === "f" ? "btn-primary" : "btn-ghost"}`}
          style={{ flex: 1, padding: "12px" }}
          onClick={() => setGender("f")}
        >
          Frau
        </button>
      </div>
      <label className="kicker">Echter Partner (optional)</label>
      <select
        className="field-input"
        value={partnerId}
        onChange={(e) => setPartnerId(e.target.value)}
      >
        <option value="">— Kein echter Partner —</option>
        {partnerOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.real_name}
          </option>
        ))}
      </select>
      {err && <p style={{ color: "var(--loss)", fontSize: 13 }}>{err}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setOpen(false)}>
          Abbrechen
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={submit}
          disabled={busy || name.trim().length < 1}
        >
          {busy ? "Speichere…" : "Anlegen"}
        </button>
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  roster,
  onChange,
}: {
  player: RosterPlayer;
  roster: RosterPlayer[];
  onChange: () => void;
}) {
  const partner = roster.find((r) => r.id === player.real_partner_id) ?? null;
  const joined = !!player.joined_at;
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (joined) return;
    if (!confirm(`${player.real_name} wirklich löschen?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/roster/${player.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error ?? "Fehler beim Löschen");
        return;
      }
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card pad" style={{ display: "flex", gap: 12 }}>
      <AvatarBlock player={player} onChange={onChange} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "var(--fg1)" }}>
            {player.real_name ?? "—"}
          </span>
          <span className="kicker">{player.gender === "m" ? "♂" : "♀"}</span>
          {joined && (
            <span className="locked-pill" style={{ background: "rgba(5,150,105,.10)", color: "var(--green-400)" }}>
              beigetreten
            </span>
          )}
        </div>
        {partner && (
          <div style={{ fontSize: 12, color: "var(--fg3)" }}>
            ↔ Echter Partner: {partner.real_name}
          </div>
        )}
        {player.username && (
          <div style={{ fontSize: 12, color: "var(--fg3)" }}>
            Pseudonym: <span style={{ color: "var(--fg2)" }}>{player.username}</span>
          </div>
        )}
        <InviteLink code={player.invite_code} />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            className="btn btn-ghost"
            style={{ width: "auto", padding: "8px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            onClick={remove}
            disabled={joined || busy}
            title={joined ? "Bereits beigetreten — Löschen blockiert" : ""}
          >
            <Trash2 size={14} /> Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteLink({ code }: { code: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!code) return null;
  const url = typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : `/join/${code}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="btn btn-ghost"
      style={{
        width: "auto",
        padding: "6px 10px",
        marginTop: 6,
        fontSize: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--bg-elevated)",
        wordBreak: "break-all",
        textAlign: "left",
        fontFamily: "monospace",
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? "Link kopiert" : `/${code}`}</span>
    </button>
  );
}

// ----------------------------------------------------- Avatar-Block --------

function AvatarBlock({
  player,
  onChange,
}: {
  player: RosterPlayer;
  onChange: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Cache-Buster — wird nach Upload/Delete hochgezählt, damit der Browser den
  // Preview-Endpoint neu lädt. Aus Props + ver direkt abgeleitet (kein useEffect).
  const [ver, setVer] = useState(0);
  const previewSrc = player.avatar_url
    ? `/api/admin/roster/${player.id}/avatar/preview?v=${ver}`
    : null;

  async function fileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // Reset, damit gleiche Datei nochmal wählbar ist
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      alert("Foto zu groß (>20MB) — bitte kleineres Bild auswählen.");
      return;
    }
    setBusy(true);
    try {
      // Auf max 800×800 verkleinern + als JPEG q=0.85 → ~50–200 KB.
      // Liegt sicher unter dem Supabase-Bucket-Limit (512 KB).
      const dataUrl = await downscaleImage(f, 800, 0.85);
      const res = await fetch(`/api/admin/roster/${player.id}/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_data_url: dataUrl }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Upload fehlgeschlagen");
        return;
      }
      setVer((v) => v + 1);
      onChange();
    } catch (err) {
      alert("Bildverarbeitung fehlgeschlagen: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeAvatar() {
    if (!player.avatar_url) return;
    if (!confirm("Foto wirklich entfernen?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/roster/${player.id}/avatar`, { method: "DELETE" });
      if (!res.ok) {
        alert("Löschen fehlgeschlagen");
        return;
      }
      setVer((v) => v + 1);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 84 }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          overflow: "hidden",
          background: "var(--surface-2)",
          border: "1px solid var(--border-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fg4)",
        }}
      >
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Camera size={22} />
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={fileChosen}
      />
      <div style={{ display: "flex", gap: 4 }}>
        <button
          type="button"
          className="icon-btn"
          style={{ width: 30, height: 30 }}
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="Foto hochladen"
          title="Foto hochladen"
        >
          <Upload size={14} />
        </button>
        {player.avatar_url && (
          <button
            type="button"
            className="icon-btn"
            style={{ width: 30, height: 30 }}
            onClick={removeAvatar}
            disabled={busy}
            aria-label="Foto entfernen"
            title="Foto entfernen"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Lädt das Bild, skaliert auf max `maxSize` (längere Seite) und liefert
 * eine JPEG-data-URL mit der gegebenen Qualität. EXIF-Orientierung wird
 * von createImageBitmap implizit normalisiert.
 */
async function downscaleImage(
  file: File,
  maxSize: number,
  quality: number,
): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Bild nicht lesbar"));
    i.src = dataUrl;
  });
  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas-Kontext nicht verfügbar");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

// ====================================================== Teams ============

function TeamsSection({
  teams,
  roster,
  onChange,
}: {
  teams: Team[];
  roster: RosterPlayer[];
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const someoneJoined = roster.some((p) => p.joined_at);

  async function dice() {
    if (someoneJoined) {
      alert("Mindestens ein Spieler ist bereits beigetreten — Würfeln gesperrt.");
      return;
    }
    if (!confirm("Spielteams jetzt neu auswürfeln?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/teams/generate", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        alert(j.error ?? "Würfeln fehlgeschlagen");
        return;
      }
      onChange();
    } finally {
      setBusy(false);
    }
  }

  // Spieler nach team_id gruppieren (Übersicht)
  const byTeam = new Map<string, RosterPlayer[]>();
  for (const p of roster) {
    if (!p.team_id) continue;
    if (!byTeam.has(p.team_id)) byTeam.set(p.team_id, []);
    byTeam.get(p.team_id)!.push(p);
  }

  return (
    <section>
      <div className="section-head">
        <span className="kicker">Teams · {teams.length}</span>
        <button
          className="btn btn-secondary"
          style={{ width: "auto", padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
          onClick={dice}
          disabled={busy || someoneJoined}
          title={someoneJoined ? "Bereits jemand beigetreten — gesperrt" : ""}
        >
          <Dice5 size={16} /> {busy ? "Würfle…" : "Auswürfeln"}
        </button>
      </div>
      {someoneJoined && (
        <p className="t-small" style={{ color: "var(--fg4)", marginBottom: 8 }}>
          Mindestens ein Spieler ist beigetreten — neues Würfeln ist gesperrt.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {teams.map((t, i) => {
          const members = byTeam.get(t.id) ?? [];
          const m = members.find((x) => x.gender === "m");
          const f = members.find((x) => x.gender === "f");
          return (
            <div key={t.id} className="card pad" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="kicker">Team {i + 1}</span>
                <span style={{ fontSize: 13, color: "var(--fg2)" }}>
                  {t.team_name ?? <em style={{ color: "var(--fg4)" }}>noch ohne Namen</em>}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--fg2)" }}>
                ♂ {m?.real_name ?? "—"}{" "}
                <span style={{ color: "var(--fg4)" }}>·</span>{" "}
                ♀ {f?.real_name ?? "—"}
              </div>
            </div>
          );
        })}
        {teams.length === 0 && (
          <p className="t-small" style={{ color: "var(--fg4)" }}>
            Noch keine Teams ausgewürfelt.
          </p>
        )}
      </div>
    </section>
  );
}

// ====================================================== Matches ==========

function MatchesSection({
  matches,
  onChange,
}: {
  matches: Match[];
  onChange: () => void;
}) {
  // Nach Runde gruppieren
  const grouped = useMemo(() => {
    const map = new Map<Match["round"], Match[]>();
    for (const m of matches) {
      if (!map.has(m.round)) map.set(m.round, []);
      map.get(m.round)!.push(m);
    }
    return map;
  }, [matches]);

  return (
    <section>
      <div className="section-head">
        <span className="kicker">Spiele · {matches.length}</span>
      </div>
      <NewMatchForm onCreated={onChange} />
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 16 }}>
        {ROUND_ORDER.filter((r) => grouped.has(r)).map((r) => (
          <div key={r}>
            <div className="kicker" style={{ marginBottom: 8 }}>
              {ROUND_LABEL[r]}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped
                .get(r)!
                .slice()
                .sort((a, b) => a.match_date.localeCompare(b.match_date))
                .map((m) => (
                  <MatchCard key={m.id} match={m} onChange={onChange} />
                ))}
            </div>
          </div>
        ))}
        {matches.length === 0 && (
          <p className="t-small" style={{ color: "var(--fg4)" }}>
            Noch keine Spiele angelegt.
          </p>
        )}
      </div>
    </section>
  );
}

function MatchCard({ match, onChange }: { match: Match; onChange: () => void }) {
  const [r1, setR1] = useState<string>(match.result_1 == null ? "" : String(match.result_1));
  const [r2, setR2] = useState<string>(match.result_2 == null ? "" : String(match.result_2));
  const [savingResult, setSavingResult] = useState(false);
  const [removing, setRemoving] = useState(false);
  const dirty =
    r1 !== (match.result_1 == null ? "" : String(match.result_1)) ||
    r2 !== (match.result_2 == null ? "" : String(match.result_2));

  async function saveResult() {
    setSavingResult(true);
    try {
      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: match.id,
          result_1: r1 === "" ? null : Number(r1),
          result_2: r2 === "" ? null : Number(r2),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Speichern fehlgeschlagen");
        return;
      }
      onChange();
    } finally {
      setSavingResult(false);
    }
  }

  async function removeMatch() {
    if (!confirm(`${match.team_1} – ${match.team_2} wirklich löschen?`)) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/matches/${match.id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Löschen fehlgeschlagen");
        return;
      }
      onChange();
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Kopf: Datum + Stadion + Gruppe */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg4)" }}>
        <span>{fmtDateTime(match.match_date)}</span>
        <span>{match.group_name ?? ""}</span>
      </div>
      {match.stadium && (
        <div style={{ fontSize: 11, color: "var(--fg4)" }}>📍 {match.stadium}</div>
      )}

      {/* Mannschaften */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <span className="flag" style={{ fontSize: 24 }}>{match.flag_1}</span>
          <span style={{ fontSize: 14, color: "var(--fg1)" }}>{match.team_1}</span>
        </div>
        <span style={{ color: "var(--fg4)", fontSize: 13 }}>vs</span>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 14, color: "var(--fg1)" }}>{match.team_2}</span>
          <span className="flag" style={{ fontSize: 24 }}>{match.flag_2}</span>
        </div>
      </div>

      {/* Ergebnis-Block — sauber abgesetzt (#24) */}
      <div
        style={{
          background: "var(--bg-elevated)",
          borderRadius: 12,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span className="kicker" style={{ marginRight: "auto" }}>Ergebnis</span>
        <input
          type="number"
          min={0}
          max={30}
          className="field-input"
          style={{ width: 64, padding: "8px 10px", textAlign: "center", fontSize: 18, fontWeight: 700 }}
          value={r1}
          onChange={(e) => setR1(e.target.value)}
        />
        <span style={{ color: "var(--fg4)" }}>:</span>
        <input
          type="number"
          min={0}
          max={30}
          className="field-input"
          style={{ width: 64, padding: "8px 10px", textAlign: "center", fontSize: 18, fontWeight: 700 }}
          value={r2}
          onChange={(e) => setR2(e.target.value)}
        />
        <button
          className="btn btn-primary"
          style={{ width: "auto", padding: "10px 14px", fontSize: 13 }}
          onClick={saveResult}
          disabled={savingResult || !dirty}
        >
          {savingResult ? "…" : <Check size={14} />}
        </button>
      </div>

      {/* Footer: Löschen + Lock-Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {match.locked_at && new Date(match.locked_at) < new Date() ? (
          <span className="locked-pill"><Lock size={11} /> gesperrt</span>
        ) : (
          <span style={{ fontSize: 11, color: "var(--fg4)" }}>
            sperrt {match.locked_at ? fmtDateTime(match.locked_at) : "—"}
          </span>
        )}
        <button
          className="btn btn-ghost"
          style={{ width: "auto", padding: "6px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
          onClick={removeMatch}
          disabled={removing}
        >
          <Trash2 size={12} /> Löschen
        </button>
      </div>
    </div>
  );
}

function NewMatchForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState("");
  const [round, setRound] = useState<Match["round"]>("group");
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");
  const [f1, setF1] = useState("");
  const [f2, setF2] = useState("");
  const [date, setDate] = useState(toDatetimeLocal(new Date().toISOString()));
  const [stadium, setStadium] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function fillTeam(slot: 1 | 2, name: string) {
    const t = WM2026_TEAMS.find((x) => x.name === name);
    if (slot === 1) {
      setT1(name);
      setF1(t?.flag ?? "");
    } else {
      setT2(name);
      setF2(t?.flag ?? "");
    }
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_name: group.trim() || (round === "group" ? "?" : ROUND_LABEL[round]),
          round,
          team_1: t1.trim(),
          team_2: t2.trim(),
          flag_1: f1.trim() || "🏳️",
          flag_2: f2.trim() || "🏳️",
          match_date: fromDatetimeLocal(date),
          stadium: stadium.trim() || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "Anlegen fehlgeschlagen");
        return;
      }
      setGroup(""); setT1(""); setT2(""); setF1(""); setF2(""); setStadium("");
      setOpen(false);
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        className="btn btn-secondary"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        onClick={() => setOpen(true)}
      >
        <Plus size={18} /> Spiel anlegen
      </button>
    );
  }

  return (
    <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="field-input"
          placeholder="Gruppe (z. B. E)"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          maxLength={40}
          style={{ flex: 1 }}
        />
        <select
          className="field-input"
          value={round}
          onChange={(e) => setRound(e.target.value as Match["round"])}
          style={{ flex: 1 }}
        >
          {ROUND_ORDER.map((r) => (
            <option key={r} value={r}>
              {ROUND_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      <label className="kicker">Team 1</label>
      <div style={{ display: "flex", gap: 8 }}>
        <select
          className="field-input"
          value={t1}
          onChange={(e) => fillTeam(1, e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="">— Mannschaft 1 —</option>
          {WM2026_TEAMS.map((t) => (
            <option key={t.name} value={t.name}>
              {t.flag} {t.name}
            </option>
          ))}
        </select>
        <input
          className="field-input"
          placeholder="🏳️"
          value={f1}
          onChange={(e) => setF1(e.target.value)}
          maxLength={8}
          style={{ width: 70, textAlign: "center" }}
        />
      </div>

      <label className="kicker">Team 2</label>
      <div style={{ display: "flex", gap: 8 }}>
        <select
          className="field-input"
          value={t2}
          onChange={(e) => fillTeam(2, e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="">— Mannschaft 2 —</option>
          {WM2026_TEAMS.map((t) => (
            <option key={t.name} value={t.name}>
              {t.flag} {t.name}
            </option>
          ))}
        </select>
        <input
          className="field-input"
          placeholder="🏳️"
          value={f2}
          onChange={(e) => setF2(e.target.value)}
          maxLength={8}
          style={{ width: 70, textAlign: "center" }}
        />
      </div>

      <label className="kicker">Anstoß (lokale Zeit)</label>
      <input
        type="datetime-local"
        className="field-input"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        className="field-input"
        placeholder="Stadion (optional)"
        value={stadium}
        onChange={(e) => setStadium(e.target.value)}
        maxLength={80}
      />
      {err && <p style={{ color: "var(--loss)", fontSize: 13 }}>{err}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setOpen(false)}>
          Abbrechen
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={submit}
          disabled={busy || !t1 || !t2 || !date}
        >
          {busy ? "Speichere…" : "Anlegen"}
        </button>
      </div>
    </div>
  );
}

// ====================================================== Config ==========

function ConfigSection({
  config,
  onChange,
}: {
  config: TournamentConfig | null;
  onChange: () => void;
}) {
  const [champion, setChampion] = useState(config?.official_champion ?? "");
  const [busy, setBusy] = useState(false);
  const dirty = champion !== (config?.official_champion ?? "");

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/champion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ official_champion: champion.trim() || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j.error ?? "Speichern fehlgeschlagen");
        return;
      }
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ marginBottom: 40 }}>
      <div className="section-head">
        <span className="kicker">Weltmeister</span>
      </div>
      <div className="champion-card">
        <p className="t-small" style={{ marginBottom: 10 }}>
          Setze hier den offiziellen Weltmeister — Punkte werden automatisch neu gewertet.
        </p>
        <select value={champion} onChange={(e) => setChampion(e.target.value)}>
          <option value="">— Noch unbekannt —</option>
          {WM2026_TEAMS.map((t) => (
            <option key={t.name} value={t.name}>
              {t.flag} {t.name}
            </option>
          ))}
        </select>
        <button
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={save}
          disabled={busy || !dirty}
        >
          {busy ? "Speichere…" : "Weltmeister speichern"}
        </button>
        {config?.champion_lock_at && (
          <p className="t-small" style={{ marginTop: 10, color: "var(--fg4)" }}>
            Tipp-Sperrfrist: {fmtDateTime(config.champion_lock_at)}
          </p>
        )}
      </div>
    </section>
  );
}
