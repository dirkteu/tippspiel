"use client";
import { useEffect, useState } from "react";

/**
 * Konfetti-Effekt — 80 farbige Partikel fallen mit zufälliger Rotation +
 * Schaukelbewegung. Reines CSS, kein Library-Import.
 *
 * Lifecycle wird über Mount/Unmount gesteuert: rendere `<Confetti onDone=… />`
 * nur, wenn er sichtbar sein soll. Beim Unmount stoppt alles automatisch.
 *
 * Usage:
 *   {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
 */
interface Particle {
  left: number;
  delay: number;
  fallDuration: number;
  swayDuration: number;
  hue: number;
  rotate: number;
  emoji: string;
}

const EMOJIS = ["🎉", "🎊", "⭐", "💚", "✨", "🥇"];

function makeParticles(n: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      left: Math.random() * 100,
      delay: Math.random() * 800,
      fallDuration: 2500 + Math.random() * 2000,
      swayDuration: 600 + Math.random() * 600,
      hue: Math.floor(Math.random() * 360),
      rotate: Math.floor(Math.random() * 720) - 360,
      emoji: Math.random() < 0.35 ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : "",
    });
  }
  return out;
}

export function Confetti({
  onDone,
  durationMs = 4500,
}: {
  onDone?: () => void;
  durationMs?: number;
}) {
  // Partikel einmalig pro Mount erzeugen.
  const [particles] = useState(() => makeParticles(80));

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onDone]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 200,
      }}
    >
      <style>{`
        @keyframes sq-confetti-fall {
          0%   { transform: translate3d(0, -10vh, 0) rotate(0deg);   opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate3d(0, 110vh, 0) rotate(720deg); opacity: 0; }
        }
        @keyframes sq-confetti-sway {
          0%, 100% { margin-left: -10px; }
          50%      { margin-left: 10px; }
        }
      `}</style>
      {particles.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.emoji ? "auto" : 10,
            height: p.emoji ? "auto" : 14,
            fontSize: p.emoji ? 22 : undefined,
            background: p.emoji ? "transparent" : `hsl(${p.hue}, 85%, 58%)`,
            borderRadius: 2,
            animation: `
              sq-confetti-fall ${p.fallDuration}ms cubic-bezier(.2,.6,.4,1) ${p.delay}ms forwards,
              sq-confetti-sway ${p.swayDuration}ms ease-in-out ${p.delay}ms infinite
            `,
            transform: `rotate(${p.rotate}deg)`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}
