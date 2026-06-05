"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/primitives/Button";

interface Props {
  code: string;
  gender: "m" | "f";
  teamName: string | null;
  alreadyTeamNamed: boolean;
  isTeamNameOwner: boolean;
}

export function JoinForm({ code, gender, teamName, alreadyTeamNamed, isTeamNameOwner }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [teamNameInput, setTeamNameInput] = useState(teamName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsTeamName = isTeamNameOwner && !alreadyTeamNamed;
  const ready =
    username.trim().length >= 2 &&
    (!needsTeamName || teamNameInput.trim().length >= 2);

  async function submit() {
    if (!ready) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/profiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_code: code,
          username: username.trim(),
          team_name: needsTeamName ? teamNameInput.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Fehler beim Anlegen");
        setSubmitting(false);
        return;
      }
      if (json.login_token) localStorage.setItem("sq_login_token", json.login_token);
      router.replace("/spieltag");
    } catch (e) {
      setError("Netzwerkfehler");
      console.error(e);
      setSubmitting(false);
    }
  }

  return (
    <div
      className="scroll"
      style={{ padding: "0 24px 40px", display: "flex", flexDirection: "column" }}
    >
      <button
        type="button"
        className="icon-btn"
        style={{ marginTop: 8 }}
        onClick={() => history.back()}
        aria-label="Zurück"
      >
        <ArrowLeft size={19} />
      </button>
      <span className="kicker" style={{ marginTop: 22 }}>
        Squad beitreten · {gender === "f" ? "Frau" : "Mann"}
      </span>
      <h1 className="h1" style={{ marginTop: 6 }}>
        {gender === "f" ? "Willkommen in der Squad" : "Tritt deiner Squad bei"}
      </h1>
      <p className="t-small" style={{ marginTop: 8, marginBottom: 26 }}>
        Wähle ein Pseudonym{needsTeamName ? " und einen Team-Namen" : ""} — fertig.
        Dein Foto bekommt der Admin schon vom Spielleiter.
      </p>

      {teamName && (
        <div className="card pad" style={{ marginBottom: 16 }}>
          <span className="kicker">Dein Team</span>
          <div className="lb-name" style={{ marginTop: 4 }}>{teamName}</div>
        </div>
      )}

      <label className="kicker" style={{ marginBottom: 8 }}>Pseudonym</label>
      <input
        className="field-input"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="z. B. SchwarzwaldBomber"
        maxLength={20}
        autoComplete="off"
      />

      {needsTeamName && (
        <>
          <label className="kicker" style={{ marginBottom: 8, marginTop: 18 }}>Team-Name</label>
          <input
            className="field-input"
            value={teamNameInput}
            onChange={(e) => setTeamNameInput(e.target.value)}
            placeholder="z. B. Donnerwetter"
            maxLength={40}
            autoComplete="off"
          />
          <p className="t-small" style={{ marginTop: 6 }}>
            Den Namen siehst nur du beim Anlegen —{" "}
            {gender === "m" ? "deine Nachbarin" : "dein Nachbar"} sieht ihn ebenfalls,
            ohne deine Identität zu kennen.
          </p>
        </>
      )}

      {error && (
        <p style={{ color: "var(--loss)", marginTop: 14, fontSize: 14 }}>{error}</p>
      )}

      <div style={{ flex: 1 }} />
      <Button variant="primary" disabled={!ready || submitting} onClick={submit} style={{ marginTop: 24 }}>
        {submitting ? "Speichere…" : "Beitreten & Tippen"}
      </Button>
    </div>
  );
}
