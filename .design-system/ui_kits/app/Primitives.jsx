/* Secret Squad UI kit — shared primitives.
   Exposes components on window for the other Babel scripts. */
const { useState, useEffect, useRef, useCallback } = React;

/* Lucide icon. Renders <i data-lucide> and lets lucide.createIcons() swap it
   for an inline <svg> (color inherits via currentColor). We don't mutate icon
   props after mount, so this is stable. App calls refreshIcons() on nav change. */
function Icon({ name, size }) {
  const style = size ? { width: size, height: size } : undefined;
  return <i data-lucide={name} style={style}></i>;
}
function refreshIcons() {
  if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
}

/* iOS status bar */
function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <div className="right">
        <Icon name="signal" /><Icon name="wifi" /><Icon name="battery-full" />
      </div>
    </div>
  );
}

/* App bar with brand lockup + a trailing action */
function AppBar({ action }) {
  return (
    <div className="appbar">
      <div className="brand">
        <div className="brand-badge"><Icon name="shield-half" /></div>
        <span className="brand-name">SECRET <em>SQUAD</em></span>
      </div>
      {action}
    </div>
  );
}

function Button({ variant = "primary", children, onClick, type }) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

/* Stepper used inside a match card */
function Stepper({ value, onChange }) {
  return (
    <div className="pm">
      <button onClick={() => onChange(value + 1)} aria-label="plus">+</button>
      <button onClick={() => onChange(Math.max(0, value - 1))} aria-label="minus">−</button>
    </div>
  );
}

/* A single predictable match */
function MatchCard({ match, tip, onTip, live }) {
  const saved = tip && tip.saved;
  return (
    <div className={`card match${saved ? " saved" : ""}`}>
      <div className="top">
        <span className="meta">{match.group} · {match.date}</span>
        {live
          ? <span className="badge-live"><span className="live-dot"></span>LIVE {live}</span>
          : <span className="meta">{match.time}</span>}
      </div>
      <div className="teams">
        <div className="team">
          <span className="flag">{match.home.flag}</span>
          <span className="tn">{match.home.name}</span>
        </div>
        <div className="stepper">
          <Stepper value={tip.h} onChange={(v) => onTip({ ...tip, h: v })} />
          <span className="num">{tip.h}</span>
          <span className="colon">:</span>
          <span className="num">{tip.a}</span>
          <Stepper value={tip.a} onChange={(v) => onTip({ ...tip, a: v })} />
        </div>
        <div className="team">
          <span className="flag">{match.away.flag}</span>
          <span className="tn">{match.away.name}</span>
        </div>
      </div>
      {saved && (
        <div className="tip-flag"><Icon name="check" />Tipp gespeichert</div>
      )}
    </div>
  );
}

/* Bottom tab bar */
const TABS = [
  { id: "spieltag", icon: "house", label: "Spieltag" },
  { id: "tipps", icon: "pencil-line", label: "Tipps" },
  { id: "partner", icon: "lock", label: "Partner" },
  { id: "tabelle", icon: "bar-chart-3", label: "Tabelle" },
  { id: "profil", icon: "circle-user", label: "Profil" },
];
function BottomNav({ active, onChange }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button key={t.id} className={`tab${active === t.id ? " active" : ""}`} onClick={() => onChange(t.id)}>
          <Icon name={t.id === "partner" && active === "partner" ? "lock-open" : t.icon} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

function Toast({ show, children }) {
  return (
    <div className={`toast${show ? " show" : ""}`}>
      <Icon name="check" />{children}
    </div>
  );
}

Object.assign(window, {
  Icon, refreshIcons, StatusBar, AppBar, Button, Stepper, MatchCard, BottomNav, Toast, TABS,
});
