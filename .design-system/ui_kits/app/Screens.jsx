/* Secret Squad UI kit — screens. Depends on Primitives.jsx (window globals). */
const { useState: useS, useEffect: useE } = React;

/* ---------- SPIELTAG (home) ---------- */
function SpieltagScreen({ matches, tips, setTip, onGoTipps }) {
  const featured = matches[0];
  const tip = tips[featured.id];
  return (
    <div className="scroll">
      <AppBar action={<button className="icon-btn"><Icon name="bell" /></button>} />
      <span className="kicker">Spieltag 1 · Gruppenphase</span>
      <h1 className="h1" style={{ marginTop: 4 }}>Anpfiff in 2 Tagen</h1>

      <div className="section-head"><span className="kicker">Nächstes Spiel</span></div>
      <MatchCard match={featured} tip={tip} onTip={(t) => setTip(featured.id, t)} live={featured.live} />
      <Button variant="primary" onClick={onGoTipps}>Alle Tipps abgeben</Button>

      <div className="section-head">
        <span className="kicker">Weitere Spiele</span>
        <span className="lb-sub">{matches.length - 1} offen</span>
      </div>
      {matches.slice(1, 3).map((m) => (
        <MatchCard key={m.id} match={m} tip={tips[m.id]} onTip={(t) => setTip(m.id, t)} />
      ))}
    </div>
  );
}

/* ---------- TIPPS (full matchday list) ---------- */
function TippsScreen({ matches, tips, setTip }) {
  return (
    <div className="scroll">
      <AppBar action={<button className="icon-btn"><Icon name="filter" /></button>} />
      <span className="kicker">Deine Tipps</span>
      <h1 className="h1" style={{ marginTop: 4 }}>Spieltag 1</h1>
      <div style={{ marginTop: 16 }}>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} tip={tips[m.id]} onTip={(t) => setTip(m.id, t)} live={m.live} />
        ))}
      </div>
    </div>
  );
}

/* ---------- PARTNER (3×3 secret reveal) ---------- */
function PartnerScreen({ open, toggle, partner }) {
  const count = open.filter(Boolean).length;
  return (
    <div className="scroll">
      <AppBar action={<button className="icon-btn"><Icon name="info" /></button>} />
      <span className="kicker">Dein geheimer Partner</span>
      <h1 className="h1" style={{ marginTop: 4 }}>Wer ist es?</h1>
      <p className="t-small" style={{ marginTop: 6, marginBottom: 18 }}>
        Jeder Volltreffer deckt eine Kachel auf. Tippe eine Kachel zum Testen.
      </p>

      <div className="card partner-card">
        <div className="grid3">
          <div className="photo">{partner.emoji}</div>
          <div className="tiles">
            {open.map((isOpen, i) => (
              <div key={i} className={`tile${isOpen ? " open" : ""}`} onClick={() => toggle(i)}>
                <Icon name="lock" />
              </div>
            ))}
          </div>
        </div>
        <div className="progress"><i style={{ width: `${(count / 9) * 100}%` }}></i></div>
        <div style={{ textAlign: "center" }}>
          {count === 9
            ? <div className="partner-name">{partner.name} 🎉</div>
            : <div className="t-small">{count} / 9 Kacheln aufgedeckt</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- TABELLE (leaderboard) ---------- */
const RANKS = ["gold", "silver", "bronze"];
function TabelleScreen({ rows }) {
  return (
    <div className="scroll">
      <AppBar action={<button className="icon-btn"><Icon name="share-2" /></button>} />
      <span className="kicker">Squad · Büro-Kicker 2026</span>
      <h1 className="h1" style={{ marginTop: 4 }}>Tabelle</h1>
      <div className="lb" style={{ marginTop: 16 }}>
        {rows.map((r, i) => (
          <div key={r.name} className={`lb-row${r.me ? " me" : ""}`}>
            <span className={`lb-rank ${RANKS[i] || ""}`}>{i + 1}</span>
            <span className="lb-av">{r.av}</span>
            <div>
              <div className="lb-name">{r.name}</div>
              <div className="lb-sub">{r.hits} Volltreffer</div>
            </div>
            <span className="lb-pts">{r.pts}<small> Pkt</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- PROFIL ---------- */
function ProfilScreen() {
  return (
    <div className="scroll">
      <AppBar action={<button className="icon-btn"><Icon name="settings" /></button>} />
      <div className="profile-head">
        <div className="profile-av">⚡</div>
        <div className="partner-name" style={{ fontSize: 22 }}>Du</div>
        <span className="t-small">Mitglied seit Mai 2026</span>
      </div>
      <div className="stats" style={{ marginTop: 8 }}>
        <div className="stat"><div className="v">119</div><div className="l">Punkte gesamt</div></div>
        <div className="stat"><div className="v green">6</div><div className="l">Volltreffer</div></div>
        <div className="stat"><div className="v">#3</div><div className="l">Aktueller Rang</div></div>
        <div className="stat"><div className="v">4/9</div><div className="l">Partner-Kacheln</div></div>
      </div>
      <div className="section-head"><span className="kicker">Konto</span></div>
      <div className="card" style={{ overflow: "hidden" }}>
        {["Squad verwalten", "Benachrichtigungen", "Tipp-Regeln", "Abmelden"].map((t, i) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
            borderTop: i ? "1px solid var(--divider)" : "none", color: "var(--fg2)", fontSize: 15 }}>
            {t}
            <span style={{ marginLeft: "auto", color: "var(--fg4)", display: "flex" }}><Icon name="chevron-right" size={18} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { SpieltagScreen, TippsScreen, PartnerScreen, TabelleScreen, ProfilScreen });
