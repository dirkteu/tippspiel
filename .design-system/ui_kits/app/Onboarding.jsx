/* Secret Squad UI kit — entry flow (welcome + squad join).
   Depends on Primitives.jsx globals. */

/* ---------- WELCOME ---------- */
function WelcomeScreen({ onNext }) {
  return (
    <div className="scroll" style={{ display: "flex", flexDirection: "column", padding: "0 24px 40px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, textAlign: "center" }}>
        <div className="brand-badge" style={{ width: 64, height: 64, borderRadius: 18 }}>
          <Icon name="shield-half" size={34} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, letterSpacing: "-.02em", color: "var(--fg1)" }}>
            SECRET <span style={{ color: "var(--green-500)" }}>SQUAD</span>
          </div>
          <p className="t-body" style={{ marginTop: 10, maxWidth: 260 }}>
            Tippe die WM 2026 mit deiner Crew. Jeder Volltreffer deckt deinen geheimen Partner auf.
          </p>
        </div>
        <div className="grid3" style={{ width: 180, height: 180, marginTop: 4 }}>
          <div className="photo" style={{ fontSize: 90 }}>⚽</div>
          <div className="tiles">
            {[1,0,1,0,1,1,0,1,0].map((v, i) => (
              <div key={i} className={`tile${v ? "" : " open"}`}><Icon name="lock" /></div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Button variant="primary" onClick={onNext}>Squad beitreten</Button>
        <Button variant="ghost" onClick={onNext}>Ich habe schon ein Konto</Button>
      </div>
    </div>
  );
}

/* ---------- SQUAD JOIN ---------- */
function JoinScreen({ onJoin, onBack }) {
  const [code, setCode] = React.useState("");
  const [focus, setFocus] = React.useState(false);
  const ok = code.trim().length >= 4;
  return (
    <div className="scroll" style={{ padding: "0 24px 40px", display: "flex", flexDirection: "column" }}>
      <button className="icon-btn" style={{ marginTop: 8 }} onClick={onBack}><Icon name="arrow-left" /></button>
      <span className="kicker" style={{ marginTop: 22 }}>Schritt 1 von 1</span>
      <h1 className="h1" style={{ marginTop: 6 }}>Squad beitreten</h1>
      <p className="t-small" style={{ marginTop: 8, marginBottom: 26 }}>
        Gib den Einladungscode ein, den dein Squad-Admin geteilt hat.
      </p>

      <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--fg3)", marginBottom: 8 }}>Einladungscode</label>
      <input
        className={`field-input`}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        placeholder="z. B. WM26-XYZ"
        style={{
          width: "100%", boxSizing: "border-box", background: "var(--bg-elevated)",
          border: `1px solid ${focus ? "var(--accent)" : "var(--border)"}`,
          boxShadow: focus ? "0 0 0 3px var(--green-tint)" : "none",
          borderRadius: 8, padding: "15px 16px", color: "var(--fg1)",
          fontFamily: "var(--font-mono)", fontSize: 17, letterSpacing: ".04em", outline: "none",
        }}
      />

      <div className="card" style={{ marginTop: 16, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26 }}>🏟️</span>
        <div>
          <div className="lb-name">Büro-Kicker 2026</div>
          <div className="lb-sub">5 Mitglieder · Spieltag 1 offen</div>
        </div>
        <span style={{ marginLeft: "auto", color: ok ? "var(--green-400)" : "var(--fg4)", display: "flex" }}>
          <Icon name={ok ? "check-circle-2" : "circle"} />
        </span>
      </div>

      <div style={{ flex: 1 }}></div>
      <Button variant="primary" onClick={onJoin}>Beitreten & Tippen</Button>
    </div>
  );
}

Object.assign(window, { WelcomeScreen, JoinScreen });
