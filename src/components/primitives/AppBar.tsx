import Link from "next/link";
import { Info, ShieldHalf } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Standard-AppBar. Wenn keine eigene Action angegeben, zeigt sie automatisch
 * den Info-Button (Link zu /regeln) — damit Regelseite überall erreichbar.
 */
export function AppBar({ action }: { action?: ReactNode }) {
  return (
    <div className="appbar">
      <div className="brand">
        <div className="brand-badge">
          <ShieldHalf size={17} color="#fff" />
        </div>
        <span className="brand-name">
          BÜLSER <em>ALM</em>
        </span>
      </div>
      {action ?? (
        <Link href="/regeln" className="icon-btn" aria-label="Tipp-Regeln">
          <Info size={19} />
        </Link>
      )}
    </div>
  );
}
